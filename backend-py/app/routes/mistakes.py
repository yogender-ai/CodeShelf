from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import Mistake, User
from app.routes.utils import fallback_card_from_mistake, mistake_out


router = APIRouter(prefix="/api/mistakes", tags=["mistakes"])


class MistakeIn(BaseModel):
    note_id: str | None = None
    problem_id: str | None = None
    mistake_title: str
    wrong_approach: str = ""
    correct_approach: str = ""
    reason: str = ""
    prevention_tip: str = ""
    topic: str = "General"
    times_repeated: int = 1
    generate_card: bool = True


@router.get("")
async def list_mistakes(topic: str = "", user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Mistake).where(Mistake.user_id == user.id)
    if topic:
        query = query.where(Mistake.topic == topic)
    result = await db.execute(query.order_by(Mistake.created_at.desc()))
    return {"mistakes": [mistake_out(mistake) for mistake in result.scalars().all()]}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_mistake(body: MistakeIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    mistake = Mistake(user_id=user.id, last_seen_at=datetime.now(timezone.utc), **body.model_dump(exclude={"generate_card"}))
    db.add(mistake)
    await db.flush()
    if body.generate_card:
        db.add(fallback_card_from_mistake(mistake))
    await db.flush()
    return {"mistake": mistake_out(mistake)}


@router.put("/{mistake_id}")
async def update_mistake(mistake_id: str, body: MistakeIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mistake).where(Mistake.id == mistake_id, Mistake.user_id == user.id))
    mistake = result.scalar_one_or_none()
    if not mistake:
        raise HTTPException(status_code=404, detail="Mistake not found.")
    for key, value in body.model_dump(exclude={"generate_card"}).items():
        setattr(mistake, key, value)
    mistake.last_seen_at = datetime.now(timezone.utc)
    await db.flush()
    return {"mistake": mistake_out(mistake)}


@router.delete("/{mistake_id}")
async def delete_mistake(mistake_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mistake).where(Mistake.id == mistake_id, Mistake.user_id == user.id))
    mistake = result.scalar_one_or_none()
    if not mistake:
        raise HTTPException(status_code=404, detail="Mistake not found.")
    await db.delete(mistake)
    return {"ok": True}
