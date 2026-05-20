from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import DailyActivity, ReviewLog, RevisionCard, User
from app.routes.utils import MIN_DAILY_CARDS, card_out, get_or_create_today_activity, next_interval, recalc_streak


router = APIRouter(prefix="/api/revision", tags=["revision"])


class CardIn(BaseModel):
    question: str
    answer: str
    card_type: str = "recall"
    topic: str = "General"
    difficulty: str = "Medium"
    note_id: str | None = None
    problem_id: str | None = None
    mistake_id: str | None = None
    next_review_date: date | None = None


class ReviewIn(BaseModel):
    rating: str


class OfflineReview(BaseModel):
    card_id: str
    rating: str


class OfflineSyncIn(BaseModel):
    reviews: list[OfflineReview] = []


@router.get("/today")
async def today_revision(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = date.today()
    result = await db.execute(
        select(RevisionCard)
        .where(RevisionCard.user_id == user.id, RevisionCard.next_review_date <= today)
        .order_by(RevisionCard.next_review_date.asc(), RevisionCard.difficulty.desc())
    )
    cards = result.scalars().all()
    activity = await get_or_create_today_activity(db, user)
    weak_topics = await _weak_topics(db, user)
    return {
        "cards": [card_out(card) for card in cards],
        "progress": {"done": activity.cards_reviewed, "total": max(len(cards) + activity.cards_reviewed, MIN_DAILY_CARDS)},
        "streak": {"current": user.current_streak, "longest": user.longest_streak, "completed_today": activity.completed_today},
        "weak_topics": weak_topics,
    }


@router.post("/cards", status_code=status.HTTP_201_CREATED)
async def create_card(body: CardIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    card = RevisionCard(user_id=user.id, next_review_date=body.next_review_date or date.today(), **body.model_dump(exclude={"next_review_date"}))
    db.add(card)
    await db.flush()
    return {"card": card_out(card)}


@router.post("/cards/{card_id}/review")
async def review_card(card_id: str, body: ReviewIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RevisionCard).where(RevisionCard.id == card_id, RevisionCard.user_id == user.id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Revision card not found.")
    old_interval = card.interval_days
    interval, memory_delta = next_interval(body.rating, old_interval)
    card.interval_days = interval
    card.memory_strength = max(0.0, min(1.0, card.memory_strength + memory_delta))
    card.last_reviewed_at = datetime.now(timezone.utc)
    card.next_review_date = date.today() + timedelta(days=interval)
    card.review_status = "reviewed"
    db.add(ReviewLog(user_id=user.id, revision_card_id=card.id, rating=body.rating, old_interval=old_interval, new_interval=interval))
    activity = await get_or_create_today_activity(db, user)
    activity.cards_reviewed += 1
    if card.problem_id:
        activity.problems_revised += 1
    if card.note_id:
        activity.notes_revised += 1
    if card.mistake_id or card.card_type == "mistake":
        activity.mistakes_fixed += 1
    activity.completed_today = activity.cards_reviewed >= MIN_DAILY_CARDS
    await recalc_streak(db, user)
    await db.flush()
    return {"card": card_out(card), "activity": {"cards_reviewed": activity.cards_reviewed, "completed_today": activity.completed_today}}


@router.get("/walk-mode")
async def walk_mode(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await today_revision(user, db)
    return {"cards": data["cards"][:10], "mode": "walk"}


@router.get("/travel-pack")
async def travel_pack(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await today_revision(user, db)
    return {"downloaded_at": datetime.now(timezone.utc).isoformat(), "cards": data["cards"][:20]}


@router.post("/sync-offline-progress")
async def sync_offline_progress(body: OfflineSyncIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    synced = []
    for item in body.reviews:
        result = await db.execute(select(RevisionCard).where(RevisionCard.id == item.card_id, RevisionCard.user_id == user.id))
        card = result.scalar_one_or_none()
        if not card:
            continue
        old_interval = card.interval_days
        interval, memory_delta = next_interval(item.rating, old_interval)
        card.interval_days = interval
        card.memory_strength = max(0.0, min(1.0, card.memory_strength + memory_delta))
        card.last_reviewed_at = datetime.now(timezone.utc)
        card.next_review_date = date.today() + timedelta(days=interval)
        db.add(ReviewLog(user_id=user.id, revision_card_id=card.id, rating=item.rating, old_interval=old_interval, new_interval=interval))
        synced.append(card.id)
    activity = await get_or_create_today_activity(db, user)
    activity.cards_reviewed += len(synced)
    activity.completed_today = activity.cards_reviewed >= MIN_DAILY_CARDS
    await recalc_streak(db, user)
    return {"synced": synced, "activity": {"cards_reviewed": activity.cards_reviewed, "completed_today": activity.completed_today}}


async def _weak_topics(db: AsyncSession, user: User) -> list[dict]:
    result = await db.execute(
        select(RevisionCard.topic, func.count(ReviewLog.id))
        .join(ReviewLog, ReviewLog.revision_card_id == RevisionCard.id)
        .where(RevisionCard.user_id == user.id, ReviewLog.rating.in_(["forgot", "again", "hard"]))
        .group_by(RevisionCard.topic)
        .order_by(func.count(ReviewLog.id).desc())
        .limit(5)
    )
    return [{"topic": topic, "misses": count} for topic, count in result.all()]
