"""
CodeShelf — Activity Log, Streak, and SharedNote Models
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import (
    Date, DateTime, ForeignKey, Index, String, Text,
    UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ActivityLog(Base):
    """A single user action record."""

    __tablename__ = "activity_log"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        default=uuid.uuid4, server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    type: Mapped[str] = mapped_column(
        String(30), nullable=False,
        comment="published | group | login | edit | share | delete",
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    note_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("notes.id", ondelete="SET NULL"), nullable=True,
    )
    group_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="SET NULL"), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    user = relationship("User", back_populates="activity_logs")

    __table_args__ = (
        Index("ix_activity_log_user_id", "user_id"),
        Index("ix_activity_log_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<ActivityLog id={self.id!s} type={self.type!r}>"


class Streak(Base):
    """Daily activity record for a user — one row per (user, date)."""

    __tablename__ = "streaks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        default=uuid.uuid4, server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    user = relationship("User", back_populates="streaks")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_streak_user_date"),
        Index("ix_streaks_user_date", "user_id", "date"),
    )

    def __repr__(self) -> str:
        return f"<Streak user_id={self.user_id!s} date={self.date!s}>"


class SharedNote(Base):
    """Records an explicit note-sharing event between two users."""

    __tablename__ = "shared_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        default=uuid.uuid4, server_default=func.gen_random_uuid(),
    )
    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False,
    )
    from_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    to_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, default="", server_default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("note_id", "to_user_id", name="uq_shared_note_recipient"),
    )

    def __repr__(self) -> str:
        return f"<SharedNote note_id={self.note_id!s} to={self.to_user_id!s}>"
