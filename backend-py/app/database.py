from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings


settings = get_settings()


def _engine_kwargs(url: str) -> dict:
    if url.startswith("postgresql"):
        clean_url = url.replace("?sslmode=require", "").replace("&sslmode=require", "")
        return {
            "url": clean_url,
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "connect_args": {"ssl": "require"} if "neon.tech" in url or "sslmode=require" in url else {},
        }
    return {"url": url, "connect_args": {"check_same_thread": False} if url.startswith("sqlite") else {}}


engine = create_async_engine(**_engine_kwargs(settings.database_url), echo=False)
async_session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
