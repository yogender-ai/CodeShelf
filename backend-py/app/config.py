from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = "sqlite+aiosqlite:///./codeshelf_dev.db"
    database_url_sync: str = ""

    jwt_secret: str = "codeshelf-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_days: int = 14

    backend_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    frontend_url: str = "http://127.0.0.1:5173"
    environment: str = "development"
    port: int = 8000

    resend_api_key: str = ""
    resend_from_email: str = "CodeShelf <revision@codeshelf.local>"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    hf_api_key: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def sync_database_url(self) -> str:
        if self.database_url_sync:
            return self.database_url_sync
        return self.database_url.replace("+asyncpg", "").replace("+aiosqlite", "")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
