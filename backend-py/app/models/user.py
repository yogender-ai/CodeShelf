"""
CodeShelf — User Model

Stores user profiles, credentials, streak tracking, and role information.
Passwords are stored as hashed strings (supports both legacy pbkdf2 and bcrypt).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.associations import note_shared_users, group_members

if TYPE_CHECKING:
    from app.models.note import Note
    from app.models.group import Group
    from app.models.activity import ActivityLog, Streak


class User(Base):
    """A registered CodeShelf user."""

    __tablename__ = "users"

    # ── Primary Key ───────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )

    # ── Legacy ID (for migration traceability) ────────────────────────
    legacy_id: Mapped[Optional[str]] = mapped_column(
        String(100), unique=True, nullable=True, index=True,
    )

    # ── Profile ───────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    password_scheme: Mapped[str] = mapped_column(
        String(20), nullable=False, default="bcrypt", server_default="bcrypt",
        comment="'pbkdf2' for legacy migrated users, 'bcrypt' for new users",
    )
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="Contributor", server_default="Contributor")
    bio: Mapped[str] = mapped_column(Text, default="", server_default="")
    location: Mapped[str] = mapped_column(String(120), default="", server_default="")
    github: Mapped[str] = mapped_column(String(255), default="", server_default="")
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # ── Streaks ───────────────────────────────────────────────────────
    streak_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    max_streak: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    last_active_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # ── Timestamps ────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ─────────────────────────────────────────────────
    authored_notes: Mapped[list["Note"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    owned_groups: Mapped[list["Group"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    groups: Mapped[list["Group"]] = relationship(
        secondary=group_members,
        back_populates="members",
        lazy="selectin",
    )
    shared_notes: Mapped[list["Note"]] = relationship(
        secondary=note_shared_users,
        back_populates="shared_with_users",
        lazy="selectin",
    )
    streaks: Mapped[list["Streak"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    activity_logs: Mapped[list["ActivityLog"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # ── Indexes ───────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_users_email", "email", unique=True),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id!s} email={self.email!r}>"
