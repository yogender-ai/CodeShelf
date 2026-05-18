"""
CodeShelf — Notes Pydantic Schemas (v2)

Request and response models for the Notes CRUD API,
spaced-repetition review queue, and view logging.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Nested helpers ────────────────────────────────────────────────────

class TagOut(BaseModel):
    """Minimal tag representation embedded in note responses."""
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True


class SubjectOut(BaseModel):
    """Minimal subject representation embedded in note responses."""
    id: uuid.UUID
    name: str
    slug: str
    color: str
    icon: str

    class Config:
        from_attributes = True


class AuthorOut(BaseModel):
    """Minimal author representation embedded in note responses."""
    id: uuid.UUID
    name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


# ── Request Schemas ───────────────────────────────────────────────────

class NoteCreate(BaseModel):
    """POST /api/notes body."""
    title: str = Field(..., min_length=1, max_length=300)
    description: str = Field(default="", max_length=2000)
    content: str = Field(..., min_length=1)
    subject_id: uuid.UUID
    type: str = Field(default="Note", pattern=r"^(Note|Concept|Project)$")
    difficulty: str = Field(default="Medium", pattern=r"^(Easy|Medium|Hard)$")
    repo_url: str = Field(default="", max_length=500)
    visibility: str = Field(default="private", pattern=r"^(public|private|group)$")
    tags: list[str] = Field(default_factory=list, max_length=20)


class NoteUpdate(BaseModel):
    """PATCH /api/notes/{id} body — all fields optional."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=300)
    description: Optional[str] = Field(default=None, max_length=2000)
    content: Optional[str] = Field(default=None, min_length=1)
    subject_id: Optional[uuid.UUID] = None
    type: Optional[str] = Field(default=None, pattern=r"^(Note|Concept|Project)$")
    difficulty: Optional[str] = Field(default=None, pattern=r"^(Easy|Medium|Hard)$")
    repo_url: Optional[str] = Field(default=None, max_length=500)
    visibility: Optional[str] = Field(default=None, pattern=r"^(public|private|group)$")
    tags: Optional[list[str]] = None


# ── Response Schemas ──────────────────────────────────────────────────

class NoteResponse(BaseModel):
    """Single note returned by all read/write endpoints."""
    id: uuid.UUID
    title: str
    description: str
    content: str
    type: str
    difficulty: str
    repo_url: str
    visibility: str
    views: int
    likes: int
    created_at: datetime
    updated_at: datetime
    author: AuthorOut
    subject: SubjectOut
    tags: list[TagOut] = []

    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    """Paginated list of notes."""
    notes: list[NoteResponse]
    total: int


class NoteDeleteResponse(BaseModel):
    """Returned after deleting a note."""
    ok: bool = True
    message: str = "Note deleted successfully."


class NoteViewResponse(BaseModel):
    """Returned after logging a note view."""
    ok: bool = True
    views: int
    streak_count: int
    message: str = "View logged successfully."
