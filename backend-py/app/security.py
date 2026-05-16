"""
CodeShelf — Password Hashing & Verification Utilities

Supports two schemes:
  1. **pbkdf2** — Legacy hashes migrated from the Node.js backend.
     Format: `<hex-salt>:<hex-hash>` (PBKDF2-HMAC-SHA256, 120 000 iterations, 32-byte key).
  2. **bcrypt** — Used for all new registrations and silent upgrades.

On login, if a user's password_scheme is 'pbkdf2' and the password
verifies, the hash is silently upgraded to bcrypt.
"""

from __future__ import annotations

import hashlib
import hmac
from typing import Tuple

from passlib.context import CryptContext

# ── Bcrypt context (primary scheme) ───────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Legacy pbkdf2 verification (matches Node.js server.js) ───────────

def _verify_pbkdf2(password: str, stored_hash: str) -> bool:
    """
    Verify a password against a legacy pbkdf2 hash.

    The Node.js backend stores hashes as: `<hex-salt>:<hex-derived-key>`
    Using: pbkdf2Sync(password, salt, 120000, 32, 'sha256')

    IMPORTANT: Node's pbkdf2Sync passes the hex salt as a UTF-8 string,
    NOT as raw bytes. We must replicate that behaviour here.
    """
    if ":" not in stored_hash:
        return False

    salt_hex, hash_hex = stored_hash.split(":", 1)

    # Node.js passes the hex salt as a plain string (UTF-8 encoded), not raw bytes
    salt_as_string = salt_hex.encode("utf-8")
    expected = bytes.fromhex(hash_hex)

    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_as_string, 120_000, dklen=32)

    return hmac.compare_digest(derived, expected)


# ── Unified interface ─────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a password with bcrypt (for new registrations)."""
    return pwd_context.hash(password)


def verify_password(password: str, stored_hash: str, scheme: str = "bcrypt") -> bool:
    """
    Verify a password against the stored hash.

    Dispatches to the correct algorithm based on the scheme field
    stored on the User row.
    """
    if scheme == "pbkdf2":
        return _verify_pbkdf2(password, stored_hash)
    return pwd_context.verify(password, stored_hash)
