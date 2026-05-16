"""
CodeShelf Backend — FastAPI Application Entry Point

Provides:
    - CORS middleware for React frontend
    - Health check endpoint
    - Lifespan handler that verifies DB connectivity at startup
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database import engine
from app.routes.auth import router as auth_router


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup/shutdown lifecycle.

    On startup: verify the database connection is alive.
    On shutdown: dispose the engine connection pool.
    """
    # ── Startup ───────────────────────────────────────────────────
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.close()
        print("✅ Database connection verified")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        print("   The API will start but database queries will fail.")
        print("   Check your DATABASE_URL in .env")

    yield

    # ── Shutdown ──────────────────────────────────────────────────
    await engine.dispose()
    print("🔌 Database connections closed")


# ── FastAPI App ───────────────────────────────────────────────────────
app = FastAPI(
    title="CodeShelf API",
    description="CS revision platform — notes, groups, streaks, and concept search.",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware ───────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────
app.include_router(auth_router)


# ── Routes ────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
async def root():
    """Root endpoint — confirms the API is running."""
    return {"ok": True, "message": "CodeShelf API v2 is running"}


@app.get("/api/health", tags=["health"])
async def health_check():
    """Health check — verifies database connectivity."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"ok": True, "name": "CodeShelf API", "database": "connected"}
    except Exception as e:
        return {"ok": False, "name": "CodeShelf API", "database": str(e)}
