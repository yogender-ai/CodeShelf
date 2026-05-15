"""
CodeShelf Backend — Application Settings

Loads configuration from environment variables / .env file.
Uses pydantic-settings for validation and type coercion.
"""

from __future__ import annotations

from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve the .env file relative to the project root (two levels up from this file)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Application settings loaded from .env or environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────
    database_url: str  # postgresql+asyncpg://...
    database_url_sync: str = ""  # postgresql://... (for Alembic)

    # ── JWT ───────────────────────────────────────────────────────────
    jwt_secret: str = "codeshelf-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_days: int = 14

    # ── CORS ──────────────────────────────────────────────────────────
    backend_cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # ── Server ────────────────────────────────────────────────────────
    port: int = 8000

    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Cached settings instance.

    Call this instead of constructing Settings() directly so the .env
    file is only read once per process.
    """
    return Settings()  # type: ignore[call-arg]
