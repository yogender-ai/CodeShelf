"""
CodeShelf — Subject Model

Represents the top-level topic categories: DSA, SQL, ML, NLP, Projects, Concepts.
Pre-seeded during initial migration; notes reference subjects via FK.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.note import Note


class Subject(Base):
    """A top-level topic category (e.g. DSA, SQL, ML)."""

    __tablename__ = "subjects"

    # ── Primary Key ───────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )

    # ── Fields ────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    color: Mapped[str] = mapped_column(String(10), nullable=False)
    icon: Mapped[str] = mapped_column(String(30), nullable=False)

    # ── Timestamps ────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────
    notes: Mapped[list["Note"]] = relationship(
        back_populates="subject",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Subject name={self.name!r} slug={self.slug!r}>"
