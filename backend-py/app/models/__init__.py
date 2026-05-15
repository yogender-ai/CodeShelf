"""
CodeShelf — Models Package

Re-exports all ORM models and the Base for convenient imports:
    from app.models import Base, User, Note, Tag, Subject, ...
"""

from app.models.base import Base
from app.models.user import User
from app.models.subject import Subject
from app.models.tag import Tag
from app.models.note import Note, NoteImage
from app.models.group import Group, GroupMessage
from app.models.activity import ActivityLog, Streak, SharedNote

# Association tables (needed for Alembic to discover them)
from app.models.associations import (
    note_tags,
    note_shared_users,
    group_members,
    group_notes,
)

__all__ = [
    "Base",
    "User",
    "Subject",
    "Tag",
    "Note",
    "NoteImage",
    "Group",
    "GroupMessage",
    "ActivityLog",
    "Streak",
    "SharedNote",
    "note_tags",
    "note_shared_users",
    "group_members",
    "group_notes",
]
