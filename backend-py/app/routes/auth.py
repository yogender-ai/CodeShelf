"""
CodeShelf — Auth Routes

Endpoints:
    POST /api/auth/register  — Create a new user account
    POST /api/auth/login     — Authenticate and receive tokens
    GET  /api/auth/me        — Get current user profile (protected)
    POST /api/auth/refresh   — Exchange a refresh token for new tokens
"""

from __future__ import annotations

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.jwt_utils import create_access_token, create_refresh_token, decode_token
from app.models import User, Streak, ActivityLog
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserResponse,
)
from app.security import hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── POST /api/auth/register ──────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.

    Creates the user, initialises a streak row for today, and
    logs a 'registered' activity entry.
    """
    # Check for duplicate email
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create user
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        password_scheme="bcrypt",
        role="Contributor",
    )
    db.add(user)
    await db.flush()  # Assigns user.id

    # Initialize streak for today
    today = date.today()
    streak = Streak(user_id=user.id, date=today)
    db.add(streak)

    # Update user streak counters
    user.streak_count = 1
    user.max_streak = 1
    user.last_active_date = today

    # Log activity
    activity = ActivityLog(
        user_id=user.id,
        type="registered",
        text=f"{user.name} joined CodeShelf",
    )
    db.add(activity)

    await db.flush()

    # Generate tokens
    tokens = TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=tokens,
    )


# ── POST /api/auth/login ─────────────────────────────────────────────

@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate a user with email + password.

    If the user's password is stored as a legacy pbkdf2 hash,
    it is verified against that scheme and silently upgraded to
    bcrypt on success.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Verify password (dispatches to correct scheme)
    if not verify_password(body.password, user.password_hash, user.password_scheme):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Silent upgrade: pbkdf2 → bcrypt
    if user.password_scheme == "pbkdf2":
        user.password_hash = hash_password(body.password)
        user.password_scheme = "bcrypt"

    # Update last active
    user.last_active_date = date.today()
    user.updated_at = datetime.now(timezone.utc)

    await db.flush()

    # Generate tokens
    tokens = TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=tokens,
    )


# ── GET /api/auth/me ──────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


# ── POST /api/auth/refresh ───────────────────────────────────────────

@router.post("/refresh", response_model=TokenPair)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """
    Exchange a valid refresh token for a new access + refresh token pair.

    The old refresh token is effectively rotated (a new one is issued).
    """
    user_id = decode_token(body.refresh_token, expected_type="refresh")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    # Verify user still exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
        )

    return TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )
