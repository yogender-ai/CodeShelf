"""
CodeShelf — Tag Model

Free-form labels attached to notes via the note_tags M2M table.
Tags are deduplicated by name (case-sensitive unique constraint).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.associations import note_tags

if TYPE_CHECKING:
    from app.models.note import Note


class Tag(Base):
    """A free-form label for categorizing notes."""

    __tablename__ = "tags"

    # ── Primary Key ───────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )

    # ── Fields ────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)

    # ── Timestamps ────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────
    notes: Mapped[list["Note"]] = relationship(
        secondary=note_tags,
        back_populates="tags",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Tag name={self.name!r}>"
