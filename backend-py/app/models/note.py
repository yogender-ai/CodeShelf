"""
CodeShelf — Note Model

The core content entity. Each note belongs to a subject (FK) and an author (FK),
and can have many tags, images, groups, and shared users via M2M relationships.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.associations import note_tags, note_shared_users, group_notes

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.subject import Subject
    from app.models.tag import Tag
    from app.models.group import Group


class Note(Base):
    """A revision note, concept explanation, or project document."""

    __tablename__ = "notes"

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

    # ── Content ───────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", server_default="")
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # ── Classification ────────────────────────────────────────────────
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subjects.id", ondelete="RESTRICT"),
        nullable=False,
    )
    type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="Note", server_default="Note",
        comment="Note | Concept | Project",
    )
    difficulty: Mapped[str] = mapped_column(
        String(20), default="Medium", server_default="Medium",
        comment="Easy | Medium | Hard",
    )

    # ── Metadata ──────────────────────────────────────────────────────
    repo_url: Mapped[str] = mapped_column(String(500), default="", server_default="")
    visibility: Mapped[str] = mapped_column(
        String(20), nullable=False, default="private", server_default="private",
        comment="public | private | group",
    )

    # ── Author FK ─────────────────────────────────────────────────────
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Stats ─────────────────────────────────────────────────────────
    views: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    likes: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

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
    author: Mapped["User"] = relationship(
        back_populates="authored_notes",
        lazy="selectin",
    )
    subject: Mapped["Subject"] = relationship(
        back_populates="notes",
        lazy="selectin",
    )
    tags: Mapped[list["Tag"]] = relationship(
        secondary=note_tags,
        back_populates="notes",
        lazy="selectin",
    )
    images: Mapped[list["NoteImage"]] = relationship(
        back_populates="note",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    shared_with_users: Mapped[list["User"]] = relationship(
        secondary=note_shared_users,
        back_populates="shared_notes",
        lazy="selectin",
    )
    groups: Mapped[list["Group"]] = relationship(
        secondary=group_notes,
        back_populates="notes",
        lazy="selectin",
    )

    # ── Indexes ───────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_notes_author_id", "author_id"),
        Index("ix_notes_subject_id", "subject_id"),
        Index("ix_notes_visibility", "visibility"),
    )

    def __repr__(self) -> str:
        return f"<Note id={self.id!s} title={self.title!r}>"


class NoteImage(Base):
    """An image attachment on a note."""

    __tablename__ = "note_images"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────
    note: Mapped["Note"] = relationship(back_populates="images")

    def __repr__(self) -> str:
        return f"<NoteImage note_id={self.note_id!s} url={self.url!r}>"
