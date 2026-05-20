"""initial coding revision platform schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-05-21
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("longest_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "tags",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(80), nullable=False),
    )
    op.create_index("ix_tags_name", "tags", ["name"], unique=True)

    op.create_table(
        "notes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("note_type", sa.String(40), nullable=False, server_default="Concept Note"),
        sa.Column("topic", sa.String(120), nullable=False, server_default="General"),
        sa.Column("subtopic", sa.String(160), nullable=False, server_default=""),
        sa.Column("difficulty", sa.String(20), nullable=False, server_default="Medium"),
        sa.Column("source", sa.String(120), nullable=False, server_default=""),
        sa.Column("source_url", sa.String(500), nullable=False, server_default=""),
        sa.Column("code_snippet", sa.Text(), nullable=False, server_default=""),
        sa.Column("language", sa.String(60), nullable=False, server_default=""),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_notes_user_id", "notes", ["user_id"])
    op.create_index("ix_notes_topic", "notes", ["topic"])
    op.create_index("ix_notes_note_type", "notes", ["note_type"])

    op.create_table(
        "note_tags",
        sa.Column("note_id", sa.String(36), sa.ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.String(36), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "problems",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", sa.String(80), nullable=False, server_default="LeetCode"),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("url", sa.String(500), nullable=False, server_default=""),
        sa.Column("difficulty", sa.String(20), nullable=False, server_default="Medium"),
        sa.Column("topic", sa.String(120), nullable=False, server_default="DSA"),
        sa.Column("pattern", sa.String(160), nullable=False, server_default=""),
        sa.Column("status", sa.String(30), nullable=False, server_default="not_started"),
        sa.Column("approach", sa.Text(), nullable=False, server_default=""),
        sa.Column("code", sa.Text(), nullable=False, server_default=""),
        sa.Column("language", sa.String(60), nullable=False, server_default=""),
        sa.Column("mistake", sa.Text(), nullable=False, server_default=""),
        sa.Column("time_complexity", sa.String(120), nullable=False, server_default=""),
        sa.Column("space_complexity", sa.String(120), nullable=False, server_default=""),
        sa.Column("last_solved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_review_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_problems_user_id", "problems", ["user_id"])
    op.create_index("ix_problems_topic", "problems", ["topic"])
    op.create_index("ix_problems_pattern", "problems", ["pattern"])
    op.create_index("ix_problems_status", "problems", ["status"])
    op.create_index("ix_problems_next_review_date", "problems", ["next_review_date"])

    op.create_table(
        "mistakes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("note_id", sa.String(36), sa.ForeignKey("notes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("problem_id", sa.String(36), sa.ForeignKey("problems.id", ondelete="SET NULL"), nullable=True),
        sa.Column("mistake_title", sa.String(300), nullable=False),
        sa.Column("wrong_approach", sa.Text(), nullable=False, server_default=""),
        sa.Column("correct_approach", sa.Text(), nullable=False, server_default=""),
        sa.Column("reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("prevention_tip", sa.Text(), nullable=False, server_default=""),
        sa.Column("topic", sa.String(120), nullable=False, server_default="General"),
        sa.Column("times_repeated", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_mistakes_user_id", "mistakes", ["user_id"])
    op.create_index("ix_mistakes_topic", "mistakes", ["topic"])

    op.create_table(
        "revision_cards",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("note_id", sa.String(36), sa.ForeignKey("notes.id", ondelete="CASCADE"), nullable=True),
        sa.Column("problem_id", sa.String(36), sa.ForeignKey("problems.id", ondelete="CASCADE"), nullable=True),
        sa.Column("mistake_id", sa.String(36), sa.ForeignKey("mistakes.id", ondelete="CASCADE"), nullable=True),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("card_type", sa.String(60), nullable=False, server_default="recall"),
        sa.Column("topic", sa.String(120), nullable=False, server_default="General"),
        sa.Column("difficulty", sa.String(20), nullable=False, server_default="Medium"),
        sa.Column("next_review_date", sa.Date(), nullable=False),
        sa.Column("last_reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("interval_days", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("memory_strength", sa.Float(), nullable=False, server_default="0"),
        sa.Column("review_status", sa.String(30), nullable=False, server_default="due"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_revision_cards_user_id", "revision_cards", ["user_id"])
    op.create_index("ix_revision_cards_topic", "revision_cards", ["topic"])
    op.create_index("ix_revision_cards_next_review_date", "revision_cards", ["next_review_date"])

    op.create_table(
        "review_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision_card_id", sa.String(36), sa.ForeignKey("revision_cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rating", sa.String(20), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("old_interval", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("new_interval", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_index("ix_review_logs_user_id", "review_logs", ["user_id"])
    op.create_index("ix_review_logs_revision_card_id", "review_logs", ["revision_card_id"])

    op.create_table(
        "daily_activity",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("cards_reviewed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("problems_revised", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notes_revised", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("mistakes_fixed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_today", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.UniqueConstraint("user_id", "date", name="uq_daily_activity_user_date"),
    )
    op.create_index("ix_daily_activity_user_id", "daily_activity", ["user_id"])
    op.create_index("ix_daily_activity_date", "daily_activity", ["date"])

    op.create_table(
        "email_preferences",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("email_time", sa.Time(), nullable=False),
        sa.Column("timezone", sa.String(80), nullable=False, server_default="Asia/Calcutta"),
        sa.Column("daily_card_count", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("include_dsa", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("include_sql", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("include_devops", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("include_mistakes", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "email_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subject", sa.String(300), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="printed"),
        sa.Column("error_message", sa.Text(), nullable=False, server_default=""),
    )
    op.create_index("ix_email_logs_user_id", "email_logs", ["user_id"])


def downgrade() -> None:
    op.drop_table("email_logs")
    op.drop_table("email_preferences")
    op.drop_table("daily_activity")
    op.drop_table("review_logs")
    op.drop_table("revision_cards")
    op.drop_table("mistakes")
    op.drop_table("problems")
    op.drop_table("note_tags")
    op.drop_table("notes")
    op.drop_table("tags")
    op.drop_table("users")
