"""
CodeShelf Backend — Async Database Engine & Session Factory

Creates an async SQLAlchemy engine connected to Neon DB (serverless Postgres)
and provides a FastAPI-compatible dependency for request-scoped sessions.
"""

from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

settings = get_settings()

# ── Async Engine ──────────────────────────────────────────────────────
# Neon DB is serverless, so we keep the pool small and enable pre-ping
# to gracefully handle connections that were closed while idle.
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,  # Recycle connections every 5 min (Neon idle timeout)
    connect_args={
        "ssl": "require",  # Neon requires SSL
    },
)

# ── Session Factory ───────────────────────────────────────────────────
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a request-scoped async session.

    Usage:
        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
