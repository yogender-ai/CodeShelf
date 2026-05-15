"""
CodeShelf — Association (join) tables for many-to-many relationships.

These are plain Table objects, not mapped ORM classes, following the
SQLAlchemy 2.0 pattern for simple join tables without extra columns.
"""

from __future__ import annotations

import uuid

from sqlalchemy import Column, ForeignKey, Table, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base

# ── Note ↔ Tag ────────────────────────────────────────────────────────
note_tags = Table(
    "note_tags",
    Base.metadata,
    Column(
        "note_id",
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# ── Note ↔ Shared Users (sharedWith[]) ────────────────────────────────
note_shared_users = Table(
    "note_shared_users",
    Base.metadata,
    Column(
        "note_id",
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "user_id",
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# ── Group ↔ Members ──────────────────────────────────────────────────
group_members = Table(
    "group_members",
    Base.metadata,
    Column(
        "group_id",
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "user_id",
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# ── Group ↔ Notes ────────────────────────────────────────────────────
group_notes = Table(
    "group_notes",
    Base.metadata,
    Column(
        "group_id",
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "note_id",
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
