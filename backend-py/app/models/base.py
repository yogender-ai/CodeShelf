"""
CodeShelf — SQLAlchemy Declarative Base

All models inherit from this Base. Provides the shared metadata
registry used by Alembic for auto-generating migrations.
"""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base for all CodeShelf ORM models."""
    pass
