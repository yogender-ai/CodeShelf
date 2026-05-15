"""
Alembic Environment — Async-aware configuration for Neon DB.

This env.py supports both online (live DB) and offline (SQL script)
migration modes using the async SQLAlchemy engine.
"""

from __future__ import annotations

import asyncio
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Ensure the backend-py directory is on sys.path so we can import app.*
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import all models so Alembic sees every table in Base.metadata
from app.models import Base  # noqa: E402
from app.config import get_settings  # noqa: E402

# Alembic Config object (provides access to alembic.ini values)
config = context.config

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata

# Override the sqlalchemy.url with the sync URL from .env
settings = get_settings()
sync_url = settings.database_url_sync or settings.database_url.replace(
    "+asyncpg", ""
)
config.set_main_option("sqlalchemy.url", sync_url)


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode — generates SQL without connecting.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations inside a connection context."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Run migrations in 'online' mode using an async engine.
    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for online migrations — delegates to async runner."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
