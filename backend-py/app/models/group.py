"""
CodeShelf — Group & GroupMessage Models

Groups are collaborative study spaces. Users join groups, and notes
can be shared into groups. Group messages provide discussion context.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.associations import group_members, group_notes

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.note import Note


class Group(Base):
    """A collaborative study group."""

    __tablename__ = "groups"

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

    # ── Fields ────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", server_default="")

    # ── Owner FK ──────────────────────────────────────────────────────
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Timestamps ────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────
    owner: Mapped["User"] = relationship(
        back_populates="owned_groups",
        lazy="selectin",
    )
    members: Mapped[list["User"]] = relationship(
        secondary=group_members,
        back_populates="groups",
        lazy="selectin",
    )
    notes: Mapped[list["Note"]] = relationship(
        secondary=group_notes,
        back_populates="groups",
        lazy="selectin",
    )
    messages: Mapped[list["GroupMessage"]] = relationship(
        back_populates="group",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Group id={self.id!s} name={self.name!r}>"


class GroupMessage(Base):
    """A message posted in a group, optionally referencing a note."""

    __tablename__ = "group_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    from_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    note_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="SET NULL"),
        nullable=True,
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────
    group: Mapped["Group"] = relationship(back_populates="messages")

    def __repr__(self) -> str:
        return f"<GroupMessage id={self.id!s} group_id={self.group_id!s}>"
