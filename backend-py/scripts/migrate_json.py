#!/usr/bin/env python3
"""
CodeShelf — JSON → PostgreSQL Migration Script

Reads backend/data/codeshelf.json and inserts all records into the
Neon DB PostgreSQL database via async SQLAlchemy.

Usage:
    cd backend-py
    python -m scripts.migrate_json

Features:
    - Idempotent: skips records that already exist (by legacy_id)
    - Inserts in dependency order to satisfy FK constraints
    - Preserves legacy pbkdf2 password hashes
    - Provides progress output with record counts
    - Full rollback on any error
"""

from __future__ import annotations

import asyncio
import json
import sys
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

# Ensure backend-py is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, engine
from app.models import (
    Base,
    User,
    Subject,
    Tag,
    Note,
    NoteImage,
    Group,
    GroupMessage,
    ActivityLog,
    Streak,
    SharedNote,
)
from app.models.associations import (
    note_tags,
    note_shared_users,
    group_members,
    group_notes,
)

# ── Path to the JSON data file ────────────────────────────────────────
JSON_FILE = Path(__file__).resolve().parent.parent.parent / "backend" / "data" / "codeshelf.json"

# ── Subject palette (mirrors topicPalette from server.js) ─────────────
TOPIC_PALETTE = {
    "DSA": {"color": "#8b5cf6", "icon": "Code"},
    "SQL": {"color": "#10b981", "icon": "Database"},
    "ML": {"color": "#3b82f6", "icon": "Sparkles"},
    "NLP": {"color": "#ec4899", "icon": "FileText"},
    "Projects": {"color": "#f59e0b", "icon": "GitBranch"},
    "Concepts": {"color": "#06b6d4", "icon": "Lightbulb"},
}


def parse_datetime(value: str | None) -> datetime | None:
    """Parse an ISO datetime string into a timezone-aware datetime."""
    if not value:
        return None
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def parse_date(value: str | None) -> date | None:
    """Parse a date string (YYYY-MM-DD) into a date object."""
    if not value:
        return None
    return date.fromisoformat(value)


async def check_existing(session: AsyncSession, model, legacy_id: str) -> bool:
    """Check if a record with this legacy_id already exists."""
    result = await session.execute(
        select(model.id).where(model.legacy_id == legacy_id)
    )
    return result.scalar_one_or_none() is not None


async def migrate(session: AsyncSession, data: dict) -> dict:
    """
    Run the full migration in dependency order.
    Returns a summary dict with record counts.
    """
    counts = {}

    # ── 1. Subjects ───────────────────────────────────────────────
    print("\n📚 Migrating subjects...")
    subject_map: dict[str, uuid.UUID] = {}  # topic_name -> subject.id

    for name, meta in TOPIC_PALETTE.items():
        # Check if subject already exists by name
        result = await session.execute(select(Subject).where(Subject.name == name))
        existing = result.scalar_one_or_none()
        if existing:
            subject_map[name] = existing.id
            print(f"   ⏭  Subject '{name}' already exists")
            continue

        subject = Subject(
            name=name,
            slug=name.lower(),
            color=meta["color"],
            icon=meta["icon"],
        )
        session.add(subject)
        await session.flush()
        subject_map[name] = subject.id
        print(f"   ✅ Subject '{name}' created")

    counts["subjects"] = len(TOPIC_PALETTE)

    # ── 2. Users ──────────────────────────────────────────────────
    print("\n👤 Migrating users...")
    user_map: dict[str, uuid.UUID] = {}  # legacy_id -> user.id

    for user_data in data.get("users", []):
        legacy_id = user_data["id"]

        if await check_existing(session, User, legacy_id):
            # Fetch existing user's UUID for later reference
            result = await session.execute(
                select(User.id).where(User.legacy_id == legacy_id)
            )
            user_map[legacy_id] = result.scalar_one()
            print(f"   ⏭  User '{user_data['name']}' already exists")
            continue

        user = User(
            legacy_id=legacy_id,
            name=user_data["name"],
            email=user_data["email"],
            password_hash=user_data["password"],
            password_scheme="pbkdf2",  # Legacy — existing hashes are pbkdf2
            role=user_data.get("role", "Contributor"),
            bio=user_data.get("bio", ""),
            location=user_data.get("location", ""),
            github=user_data.get("github", ""),
            streak_count=user_data.get("streakCount", 0),
            max_streak=user_data.get("maxStreak", 0),
            last_active_date=parse_date(user_data.get("lastActiveDate")),
            created_at=parse_datetime(user_data.get("createdAt")),
        )
        session.add(user)
        await session.flush()
        user_map[legacy_id] = user.id
        print(f"   ✅ User '{user_data['name']}' (legacy: {legacy_id}) → {user.id}")

    counts["users"] = len(data.get("users", []))

    # ── 3. Tags (collect unique tags from all notes) ──────────────
    print("\n🏷️  Migrating tags...")
    all_tag_names: set[str] = set()
    for note_data in data.get("notes", []):
        all_tag_names.update(note_data.get("tags", []))

    tag_map: dict[str, uuid.UUID] = {}  # tag_name -> tag.id

    for tag_name in sorted(all_tag_names):
        result = await session.execute(select(Tag).where(Tag.name == tag_name))
        existing = result.scalar_one_or_none()
        if existing:
            tag_map[tag_name] = existing.id
            print(f"   ⏭  Tag '{tag_name}' already exists")
            continue

        tag = Tag(name=tag_name)
        session.add(tag)
        await session.flush()
        tag_map[tag_name] = tag.id
        print(f"   ✅ Tag '{tag_name}' created")

    counts["tags"] = len(all_tag_names)

    # ── 4. Notes ──────────────────────────────────────────────────
    print("\n📝 Migrating notes...")
    note_map: dict[str, uuid.UUID] = {}  # legacy_id -> note.id

    for note_data in data.get("notes", []):
        legacy_id = note_data["id"]

        if await check_existing(session, Note, legacy_id):
            result = await session.execute(
                select(Note.id).where(Note.legacy_id == legacy_id)
            )
            note_map[legacy_id] = result.scalar_one()
            print(f"   ⏭  Note '{note_data['title']}' already exists")
            continue

        # Resolve subject
        topic = note_data.get("topic", "Concepts")
        subject_id = subject_map.get(topic, subject_map.get("Concepts"))

        # Resolve author
        author_legacy_id = note_data.get("authorId", "")
        author_id = user_map.get(author_legacy_id)
        if not author_id:
            print(f"   ⚠️  Skipping note '{note_data['title']}' — author '{author_legacy_id}' not found")
            continue

        stats = note_data.get("stats", {})

        note = Note(
            legacy_id=legacy_id,
            title=note_data["title"],
            description=note_data.get("description", ""),
            content=note_data["content"],
            subject_id=subject_id,
            type=note_data.get("type", "Note"),
            difficulty=note_data.get("difficulty", "Medium"),
            repo_url=note_data.get("repo", ""),
            visibility=note_data.get("visibility", "private"),
            author_id=author_id,
            views=stats.get("views", 0),
            likes=stats.get("likes", 0),
            created_at=parse_datetime(note_data.get("createdAt")),
            updated_at=parse_datetime(note_data.get("updatedAt")),
        )
        session.add(note)
        await session.flush()
        note_map[legacy_id] = note.id
        print(f"   ✅ Note '{note_data['title']}' (legacy: {legacy_id}) → {note.id}")

        # ── 4a. Note → Tag associations ───────────────────────────
        for tag_name in note_data.get("tags", []):
            tag_id = tag_map.get(tag_name)
            if tag_id:
                await session.execute(
                    note_tags.insert().values(note_id=note.id, tag_id=tag_id)
                )

        # ── 4b. Note → SharedWith associations ───────────────────
        for shared_user_legacy_id in note_data.get("sharedWith", []):
            shared_user_id = user_map.get(shared_user_legacy_id)
            if shared_user_id:
                await session.execute(
                    note_shared_users.insert().values(note_id=note.id, user_id=shared_user_id)
                )

        # ── 4c. Note images ──────────────────────────────────────
        for image_url in note_data.get("images", []):
            if image_url:
                image = NoteImage(note_id=note.id, url=image_url)
                session.add(image)

    counts["notes"] = len(data.get("notes", []))

    # ── 5. Groups ─────────────────────────────────────────────────
    print("\n👥 Migrating groups...")
    group_map: dict[str, uuid.UUID] = {}  # legacy_id -> group.id

    for group_data in data.get("groups", []):
        legacy_id = group_data["id"]

        if await check_existing(session, Group, legacy_id):
            result = await session.execute(
                select(Group.id).where(Group.legacy_id == legacy_id)
            )
            group_map[legacy_id] = result.scalar_one()
            print(f"   ⏭  Group '{group_data['name']}' already exists")
            continue

        owner_id = user_map.get(group_data.get("ownerId", ""))
        if not owner_id:
            print(f"   ⚠️  Skipping group '{group_data['name']}' — owner not found")
            continue

        group = Group(
            legacy_id=legacy_id,
            name=group_data["name"],
            description=group_data.get("description", ""),
            owner_id=owner_id,
            created_at=parse_datetime(group_data.get("createdAt")),
        )
        session.add(group)
        await session.flush()
        group_map[legacy_id] = group.id
        print(f"   ✅ Group '{group_data['name']}' (legacy: {legacy_id}) → {group.id}")

        # ── 5a. Group → Members ──────────────────────────────────
        for member_legacy_id in group_data.get("memberIds", []):
            member_id = user_map.get(member_legacy_id)
            if member_id:
                await session.execute(
                    group_members.insert().values(group_id=group.id, user_id=member_id)
                )

        # ── 5b. Group → Notes ────────────────────────────────────
        for note_legacy_id in group_data.get("noteIds", []):
            note_id = note_map.get(note_legacy_id)
            if note_id:
                await session.execute(
                    group_notes.insert().values(group_id=group.id, note_id=note_id)
                )

        # ── 5c. Group Messages ───────────────────────────────────
        for msg_data in group_data.get("messages", []):
            from_user_id = user_map.get(msg_data.get("fromUserId", ""))
            ref_note_id = note_map.get(msg_data.get("noteId", ""))

            if from_user_id:
                msg = GroupMessage(
                    group_id=group.id,
                    from_user_id=from_user_id,
                    note_id=ref_note_id,
                    text=msg_data.get("text", ""),
                    created_at=parse_datetime(msg_data.get("createdAt")),
                )
                session.add(msg)

    counts["groups"] = len(data.get("groups", []))

    # ── 6. Shared Notes ───────────────────────────────────────────
    print("\n🔗 Migrating shared notes...")
    for share_data in data.get("shares", []):
        note_id = note_map.get(share_data.get("noteId", ""))
        from_id = user_map.get(share_data.get("fromUserId", ""))
        to_id = user_map.get(share_data.get("toUserId", ""))

        if note_id and from_id and to_id:
            share = SharedNote(
                note_id=note_id,
                from_user_id=from_id,
                to_user_id=to_id,
                message=share_data.get("message", ""),
                created_at=parse_datetime(share_data.get("createdAt")),
            )
            session.add(share)

    counts["shares"] = len(data.get("shares", []))

    # ── 7. Activity Log ───────────────────────────────────────────
    print("\n📊 Migrating activity log...")
    for act_data in data.get("activity", []):
        user_id = user_map.get(act_data.get("userId", ""))
        if not user_id:
            print(f"   ⚠️  Skipping activity — user not found")
            continue

        activity = ActivityLog(
            user_id=user_id,
            type=act_data.get("type", "published"),
            text=act_data.get("text", ""),
            created_at=parse_datetime(act_data.get("createdAt")),
        )
        session.add(activity)

    counts["activity"] = len(data.get("activity", []))

    # ── 8. Streaks (seed from lastActiveDate) ─────────────────────
    print("\n🔥 Seeding streak records...")
    streak_count = 0
    for user_data in data.get("users", []):
        user_id = user_map.get(user_data["id"])
        last_active = parse_date(user_data.get("lastActiveDate"))
        if user_id and last_active:
            # Check if streak already exists
            result = await session.execute(
                select(Streak.id).where(
                    Streak.user_id == user_id,
                    Streak.date == last_active,
                )
            )
            if result.scalar_one_or_none() is None:
                streak = Streak(user_id=user_id, date=last_active)
                session.add(streak)
                streak_count += 1

    counts["streaks"] = streak_count

    await session.flush()
    return counts


async def main() -> None:
    """Entry point — reads JSON, runs migration, reports results."""
    print("=" * 60)
    print("  CodeShelf — JSON → PostgreSQL Migration")
    print("=" * 60)

    # ── Load JSON data ────────────────────────────────────────────
    if not JSON_FILE.exists():
        print(f"\n❌ JSON file not found: {JSON_FILE}")
        print("   Make sure backend/data/codeshelf.json exists.")
        sys.exit(1)

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"\n📂 Loaded {JSON_FILE.name}")
    print(f"   Users:    {len(data.get('users', []))}")
    print(f"   Notes:    {len(data.get('notes', []))}")
    print(f"   Groups:   {len(data.get('groups', []))}")
    print(f"   Shares:   {len(data.get('shares', []))}")
    print(f"   Activity: {len(data.get('activity', []))}")

    # ── Run migration inside a transaction ────────────────────────
    async with async_session_factory() as session:
        try:
            counts = await migrate(session, data)
            await session.commit()

            print("\n" + "=" * 60)
            print("  ✅ Migration complete!")
            print("=" * 60)
            for entity, count in counts.items():
                print(f"   {entity:.<20} {count}")
            print()

        except Exception as e:
            await session.rollback()
            print(f"\n❌ Migration failed — rolled back all changes.")
            print(f"   Error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    # ── Cleanup ───────────────────────────────────────────────────
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
