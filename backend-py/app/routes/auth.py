from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.jwt_utils import create_access_token
from app.models import User
from app.routes.utils import ensure_email_preferences, user_out
from app.security import hash_password, verify_password


router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupIn(BaseModel):
    name: str
    email: str
    password: str


class LoginIn(BaseModel):
    email: str
    password: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignupIn, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email is already registered.")
    user = User(name=body.name.strip(), email=body.email.lower(), password_hash=hash_password(body.password))
    db.add(user)
    await db.flush()
    await ensure_email_preferences(db, user)
    return {"token": create_access_token(user.id), "user": user_out(user)}


@router.post("/login")
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash, "bcrypt"):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"token": create_access_token(user.id), "user": user_out(user)}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"user": user_out(user)}
