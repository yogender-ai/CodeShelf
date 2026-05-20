from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import Mistake, Note, Problem, RevisionCard, User
from app.routes.utils import card_out, mistake_out, note_out, user_out


router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
async def dashboard(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    due_result = await db.execute(
        select(RevisionCard).where(RevisionCard.user_id == user.id, RevisionCard.next_review_date <= date.today()).limit(10)
    )
    notes_result = await db.execute(select(Note).options(selectinload(Note.tags)).where(Note.user_id == user.id).order_by(Note.updated_at.desc()).limit(5))
    mistakes_result = await db.execute(select(Mistake).where(Mistake.user_id == user.id).order_by(Mistake.created_at.desc()).limit(5))
    note_count = await db.scalar(select(func.count(Note.id)).where(Note.user_id == user.id))
    problem_count = await db.scalar(select(func.count(Problem.id)).where(Problem.user_id == user.id))
    card_count = await db.scalar(select(func.count(RevisionCard.id)).where(RevisionCard.user_id == user.id))
    due_cards = due_result.scalars().all()
    recent_notes = notes_result.scalars().unique().all()
    recent_mistakes = mistakes_result.scalars().all()
    weak_topics = {}
    for card in due_cards:
        weak_topics[card.topic] = weak_topics.get(card.topic, 0) + 1
    return {
        "user": user_out(user),
        "tagline": "Never forget what you already learned.",
        "today": {"due_cards": len(due_cards), "cards": [card_out(card) for card in due_cards[:3]]},
        "streak": {"current": user.current_streak, "longest": user.longest_streak},
        "stats": {"notes": note_count or 0, "problems": problem_count or 0, "revision_cards": card_count or 0},
        "weak_topics": [{"topic": topic, "due": count} for topic, count in sorted(weak_topics.items(), key=lambda item: item[1], reverse=True)],
        "recent_notes": [note_out(note) for note in recent_notes],
        "recent_mistakes": [mistake_out(mistake) for mistake in recent_mistakes],
    }
