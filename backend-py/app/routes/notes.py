"""
CodeShelf — Notes Routes

Endpoints:
    POST   /api/notes              — Create a new note (auto-creates tags)
    GET    /api/notes              — List user's notes (filter, search, paginate)
    GET    /api/notes/review       — Spaced-repetition review queue
    GET    /api/notes/{id}         — Get a single note
    PATCH  /api/notes/{id}         — Update a note (auto-creates tags)
    DELETE /api/notes/{id}         — Delete a note
    POST   /api/notes/{id}/view    — Log a view, update streak
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import ActivityLog, Note, Streak, Subject, Tag, User
from app.models.associations import note_tags
from app.schemas.notes import (
    NoteCreate,
    NoteDeleteResponse,
    NoteListResponse,
    NoteResponse,
    NoteUpdate,
    NoteViewResponse,
)

router = APIRouter(prefix="/api/notes", tags=["notes"])


# ── Helpers ───────────────────────────────────────────────────────────

async def _resolve_tags(
    db: AsyncSession, tag_names: list[str],
) -> list[Tag]:
    """
    Given a list of tag name strings, return Tag ORM objects.
    Creates any that don't already exist (case-sensitive).
    """
    if not tag_names:
        return []

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique_names: list[str] = []
    for name in tag_names:
        stripped = name.strip()
        if stripped and stripped not in seen:
            seen.add(stripped)
            unique_names.append(stripped)

    # Fetch existing tags in one query
    result = await db.execute(select(Tag).where(Tag.name.in_(unique_names)))
    existing_tags = {tag.name: tag for tag in result.scalars().all()}

    tags: list[Tag] = []
    for name in unique_names:
        if name in existing_tags:
            tags.append(existing_tags[name])
        else:
            new_tag = Tag(name=name)
            db.add(new_tag)
            await db.flush()  # Assigns new_tag.id
            tags.append(new_tag)

    return tags


async def _get_note_or_404(
    db: AsyncSession, note_id: uuid.UUID, user: User,
) -> Note:
    """
    Fetch a note by ID. Raises 404 if not found, 403 if not owned by user.
    """
    result = await db.execute(
        select(Note)
        .options(
            selectinload(Note.tags),
            selectinload(Note.subject),
            selectinload(Note.author),
        )
        .where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()

    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found.",
        )
    if note.author_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this note.",
        )
    return note


async def _update_streak(db: AsyncSession, user: User) -> int:
    """
    Ensure a streak row exists for today. Recalculate the user's
    current streak count by walking backward from today.
    Returns the updated streak_count.
    """
    today = date.today()

    # Upsert today's streak row (skip if it already exists)
    existing = await db.execute(
        select(Streak).where(Streak.user_id == user.id, Streak.date == today)
    )
    if existing.scalar_one_or_none() is None:
        db.add(Streak(user_id=user.id, date=today))
        await db.flush()

    # Recalculate current streak: count consecutive days ending today
    result = await db.execute(
        select(Streak.date)
        .where(Streak.user_id == user.id)
        .order_by(Streak.date.desc())
        .limit(365)
    )
    dates = sorted([row[0] for row in result.all()], reverse=True)

    streak = 0
    expected = today
    for d in dates:
        if d == expected:
            streak += 1
            expected -= timedelta(days=1)
        elif d < expected:
            break

    user.streak_count = streak
    if streak > user.max_streak:
        user.max_streak = streak
    user.last_active_date = today

    return streak


# ── POST /api/notes ──────────────────────────────────────────────────

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    body: NoteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new note. Tags are auto-created if they don't exist."""

    # Verify subject exists
    subj = await db.execute(select(Subject).where(Subject.id == body.subject_id))
    if subj.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    # Resolve tags
    tags = await _resolve_tags(db, body.tags)

    note = Note(
        title=body.title,
        description=body.description,
        content=body.content,
        subject_id=body.subject_id,
        type=body.type,
        difficulty=body.difficulty,
        repo_url=body.repo_url,
        visibility=body.visibility,
        author_id=user.id,
    )
    note.tags = tags
    db.add(note)
    await db.flush()

    # Log activity
    activity = ActivityLog(
        user_id=user.id,
        type="published",
        text=f'Created note "{note.title}"',
        note_id=note.id,
    )
    db.add(activity)
    await db.flush()

    # Re-fetch with all relationships loaded
    return await _get_note_or_404(db, note.id, user)


# ── GET /api/notes/review ────────────────────────────────────────────
# NOTE: This route must be defined BEFORE /{note_id} to avoid
# "review" being captured as a UUID path parameter.

@router.get("/review", response_model=NoteListResponse)
async def review_queue(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Spaced-repetition review queue.

    Returns notes the user hasn't updated/viewed in 3+ days,
    sorted by difficulty (Hard → Medium → Easy).
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=3)

    # Difficulty ordering: Hard=1, Medium=2, Easy=3
    difficulty_order = func.case(
        (Note.difficulty == "Hard", 1),
        (Note.difficulty == "Medium", 2),
        (Note.difficulty == "Easy", 3),
        else_=4,
    )

    query = (
        select(Note)
        .options(
            selectinload(Note.tags),
            selectinload(Note.subject),
            selectinload(Note.author),
        )
        .where(
            Note.author_id == user.id,
            Note.updated_at <= cutoff,
        )
        .order_by(difficulty_order, Note.updated_at.asc())
    )

    result = await db.execute(query)
    notes = result.scalars().unique().all()

    return NoteListResponse(
        notes=[NoteResponse.model_validate(n) for n in notes],
        total=len(notes),
    )


# ── GET /api/notes ───────────────────────────────────────────────────

@router.get("", response_model=NoteListResponse)
async def list_notes(
    subject: Optional[str] = Query(None, description="Filter by subject slug"),
    tag: Optional[str] = Query(None, description="Filter by tag name"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (Easy|Medium|Hard)"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Page size"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List the authenticated user's notes with optional filters.
    """
    query = (
        select(Note)
        .options(
            selectinload(Note.tags),
            selectinload(Note.subject),
            selectinload(Note.author),
        )
        .where(Note.author_id == user.id)
    )

    # ── Subject filter ────────────────────────────────────────────────
    if subject:
        query = query.join(Note.subject).where(Subject.slug == subject)

    # ── Tag filter ────────────────────────────────────────────────────
    if tag:
        query = query.join(Note.tags).where(Tag.name == tag)

    # ── Difficulty filter ─────────────────────────────────────────────
    if difficulty:
        query = query.where(Note.difficulty == difficulty)

    # ── Search filter (title + description) ───────────────────────────
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Note.title.ilike(pattern),
                Note.description.ilike(pattern),
            )
        )

    # ── Count total (before pagination) ───────────────────────────────
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # ── Paginate and order ────────────────────────────────────────────
    query = query.order_by(Note.updated_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    notes = result.scalars().unique().all()

    return NoteListResponse(
        notes=[NoteResponse.model_validate(n) for n in notes],
        total=total,
    )


# ── GET /api/notes/{note_id} ─────────────────────────────────────────

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single note by ID (must be owned by the current user)."""
    return await _get_note_or_404(db, note_id, user)


# ── PATCH /api/notes/{note_id} ───────────────────────────────────────

@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: uuid.UUID,
    body: NoteUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Partially update a note. Only provided fields are changed.
    Tags are replaced wholesale if the `tags` field is provided.
    """
    note = await _get_note_or_404(db, note_id, user)

    update_data = body.model_dump(exclude_unset=True)

    # Handle tags separately
    if "tags" in update_data:
        tag_names = update_data.pop("tags")
        note.tags = await _resolve_tags(db, tag_names)

    # Validate subject if changed
    if "subject_id" in update_data:
        subj = await db.execute(
            select(Subject).where(Subject.id == update_data["subject_id"])
        )
        if subj.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found.",
            )

    # Apply remaining fields
    for field, value in update_data.items():
        setattr(note, field, value)

    note.updated_at = datetime.now(timezone.utc)
    await db.flush()

    # Log activity
    activity = ActivityLog(
        user_id=user.id,
        type="edit",
        text=f'Updated note "{note.title}"',
        note_id=note.id,
    )
    db.add(activity)
    await db.flush()

    return await _get_note_or_404(db, note.id, user)


# ── DELETE /api/notes/{note_id} ──────────────────────────────────────

@router.delete("/{note_id}", response_model=NoteDeleteResponse)
async def delete_note(
    note_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a note (must be owned by the current user)."""
    note = await _get_note_or_404(db, note_id, user)

    title = note.title

    # Log activity before deleting
    activity = ActivityLog(
        user_id=user.id,
        type="delete",
        text=f'Deleted note "{title}"',
    )
    db.add(activity)

    await db.delete(note)
    await db.flush()

    return NoteDeleteResponse(message=f'Note "{title}" deleted successfully.')


# ── POST /api/notes/{note_id}/view ───────────────────────────────────

@router.post("/{note_id}/view", response_model=NoteViewResponse)
async def log_view(
    note_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Log that the user viewed a note.

    - Increments the note's view counter
    - Logs a 'view' activity entry
    - Ensures a streak row exists for today and recalculates streak
    """
    note = await _get_note_or_404(db, note_id, user)

    # Increment views
    note.views += 1
    note.updated_at = datetime.now(timezone.utc)

    # Log activity
    activity = ActivityLog(
        user_id=user.id,
        type="view",
        text=f'Viewed note "{note.title}"',
        note_id=note.id,
    )
    db.add(activity)

    # Update streak
    streak_count = await _update_streak(db, user)

    await db.flush()

    return NoteViewResponse(
        views=note.views,
        streak_count=streak_count,
    )
