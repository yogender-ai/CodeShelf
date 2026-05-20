from __future__ import annotations

from datetime import time

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import EmailLog, Mistake, RevisionCard, User
from app.routes.utils import ensure_email_preferences


router = APIRouter(prefix="/api/email", tags=["email"])
settings = get_settings()


class EmailPreferencesIn(BaseModel):
    enabled: bool = False
    email_time: str = "08:00"
    timezone: str = "Asia/Calcutta"
    daily_card_count: int = 5
    include_dsa: bool = True
    include_sql: bool = True
    include_devops: bool = True
    include_mistakes: bool = True


def parse_time(value: str) -> time:
    hour, minute = [int(part) for part in value.split(":", 1)]
    return time(hour, minute)


def prefs_out(prefs) -> dict:
    return {
        "enabled": prefs.enabled,
        "email_time": prefs.email_time.strftime("%H:%M"),
        "timezone": prefs.timezone,
        "daily_card_count": prefs.daily_card_count,
        "include_dsa": prefs.include_dsa,
        "include_sql": prefs.include_sql,
        "include_devops": prefs.include_devops,
        "include_mistakes": prefs.include_mistakes,
    }


async def build_daily_email(db: AsyncSession, user: User) -> tuple[str, str]:
    cards = (await db.execute(select(RevisionCard).where(RevisionCard.user_id == user.id).limit(3))).scalars().all()
    mistake = (await db.execute(select(Mistake).where(Mistake.user_id == user.id).limit(1))).scalar_one_or_none()
    tasks = [card.question for card in cards] or ["Add your first revision card", "Review one mistake", "Revise one coding pattern"]
    weak_topic = cards[0].topic if cards else "DSA patterns"
    mistake_text = mistake.mistake_title if mistake else "No mistake logged yet"
    subject = f"{user.name}, today's coding revision is ready"
    body = "Today you should revise:\n" + "\n".join(f"{idx}. {task}" for idx, task in enumerate(tasks, 1))
    body += f"\n\nWeak topic:\n{weak_topic}\n\nMistake to revise:\n{mistake_text}\n\nClick here to start revision:\n{settings.frontend_url}/revision/today"
    return subject, body


@router.get("/preferences")
async def get_preferences(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    prefs = await ensure_email_preferences(db, user)
    return {"preferences": prefs_out(prefs)}


@router.put("/preferences")
async def update_preferences(body: EmailPreferencesIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    prefs = await ensure_email_preferences(db, user)
    prefs.enabled = body.enabled
    prefs.email_time = parse_time(body.email_time)
    prefs.timezone = body.timezone
    prefs.daily_card_count = body.daily_card_count
    prefs.include_dsa = body.include_dsa
    prefs.include_sql = body.include_sql
    prefs.include_devops = body.include_devops
    prefs.include_mistakes = body.include_mistakes
    await db.flush()
    return {"preferences": prefs_out(prefs)}


@router.post("/preview")
async def preview_email(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    subject, body = await build_daily_email(db, user)
    return {"subject": subject, "body": body}


@router.post("/send-test")
async def send_test(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await send_daily(user, db)


@router.post("/send-daily")
async def send_daily(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    subject, body = await build_daily_email(db, user)
    status = "printed"
    error_message = ""
    if settings.resend_api_key:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.resend_api_key}", "Content-Type": "application/json"},
                    json={"from": settings.resend_from_email, "to": [user.email], "subject": subject, "text": body},
                )
                status = "sent" if response.is_success else "failed"
                if not response.is_success:
                    error_message = response.text
        except Exception as exc:
            status = "failed"
            error_message = str(exc)
    else:
        print(f"\n--- CodeShelf email preview to {user.email} ---\nSubject: {subject}\n{body}\n")
    db.add(EmailLog(user_id=user.id, subject=subject, body=body, status=status, error_message=error_message))
    return {"subject": subject, "body": body, "status": status, "error_message": error_message}
