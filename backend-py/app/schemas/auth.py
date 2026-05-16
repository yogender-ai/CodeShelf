"""
CodeShelf — Auth Pydantic Schemas (v2)

Request and response models for registration, login, token refresh,
and the /me endpoint.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ── Request Schemas ───────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """POST /api/auth/register body."""
    name: str = Field(..., min_length=1, max_length=120)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    """POST /api/auth/login body."""
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    """POST /api/auth/refresh body."""
    refresh_token: str


# ── Response Schemas ──────────────────────────────────────────────────

class TokenPair(BaseModel):
    """Returned on login and refresh — contains both tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public user profile returned by /me and on register/login."""
    id: uuid.UUID
    name: str
    email: str
    role: str
    bio: str
    location: str
    github: str
    avatar_url: Optional[str] = None
    streak_count: int
    max_streak: int
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Wraps tokens + user info for login/register responses."""
    user: UserResponse
    tokens: TokenPair


class MessageResponse(BaseModel):
    """Generic message response."""
    ok: bool = True
    message: str
