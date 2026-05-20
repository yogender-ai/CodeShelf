from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import Problem, User
from app.routes.utils import fallback_cards_from_problem, problem_out


router = APIRouter(prefix="/api/problems", tags=["problems"])


class ProblemIn(BaseModel):
    platform: str = "LeetCode"
    title: str
    url: str = ""
    difficulty: str = "Medium"
    topic: str = "DSA"
    pattern: str = ""
    status: str = "not_started"
    approach: str = ""
    code: str = ""
    language: str = ""
    mistake: str = ""
    time_complexity: str = ""
    space_complexity: str = ""
    next_review_date: date | None = None
    generate_cards: bool = True


@router.get("")
async def list_problems(
    topic: str = "",
    pattern: str = "",
    difficulty: str = "",
    status_filter: str = Query("", alias="status"),
    weak: bool = False,
    due: bool = False,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Problem).where(Problem.user_id == user.id)
    if topic:
        query = query.where(Problem.topic == topic)
    if pattern:
        query = query.where(Problem.pattern == pattern)
    if difficulty:
        query = query.where(Problem.difficulty == difficulty)
    if status_filter:
        query = query.where(Problem.status == status_filter)
    if weak:
        query = query.where(Problem.status.in_(["weak", "revisit"]))
    if due:
        query = query.where(Problem.next_review_date <= date.today())
    result = await db.execute(query.order_by(Problem.updated_at.desc()))
    return {"problems": [problem_out(problem) for problem in result.scalars().all()]}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_problem(body: ProblemIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    problem = Problem(user_id=user.id, **body.model_dump(exclude={"generate_cards"}))
    db.add(problem)
    await db.flush()
    if body.generate_cards:
        db.add_all(fallback_cards_from_problem(problem))
    await db.flush()
    return {"problem": problem_out(problem)}


@router.get("/{problem_id}")
async def get_problem(problem_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Problem).where(Problem.id == problem_id, Problem.user_id == user.id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found.")
    return {"problem": problem_out(problem)}


@router.put("/{problem_id}")
async def update_problem(problem_id: str, body: ProblemIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Problem).where(Problem.id == problem_id, Problem.user_id == user.id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found.")
    for key, value in body.model_dump(exclude={"generate_cards"}).items():
        setattr(problem, key, value)
    await db.flush()
    return {"problem": problem_out(problem)}


@router.delete("/{problem_id}")
async def delete_problem(problem_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Problem).where(Problem.id == problem_id, Problem.user_id == user.id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found.")
    await db.delete(problem)
    return {"ok": True}
