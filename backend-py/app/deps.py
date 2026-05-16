"""
CodeShelf — FastAPI Dependencies

Provides `get_current_user` — a reusable dependency that extracts and
validates the JWT Bearer token from the Authorization header and returns
the authenticated User ORM object.
"""

from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.jwt_utils import decode_token
from app.models import User

# ── Bearer token extractor ────────────────────────────────────────────
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that resolves the current authenticated user.

    Usage:
        @router.get("/protected")
        async def protected(user: User = Depends(get_current_user)):
            ...
    """
    token = credentials.credentials
    user_id = decode_token(token, expected_type="access")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
