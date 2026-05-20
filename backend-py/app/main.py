from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import shutil
import subprocess
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "backend" / "data"
DB_FILE = DATA_DIR / "codeshelf.json"
LEETCODE_EXPORT_DIR = DATA_DIR / "leetcode"
TOKEN_SECRET = os.getenv("CODESHELF_SECRET", "codeshelf-local-dev-secret")

TOPIC_PALETTE = {
    "DSA": {"color": "#8b5cf6", "icon": "Code"},
    "SQL": {"color": "#10b981", "icon": "Database"},
    "ML": {"color": "#3b82f6", "icon": "Sparkles"},
    "NLP": {"color": "#ec4899", "icon": "FileText"},
    "Projects": {"color": "#f59e0b", "icon": "GitBranch"},
    "Concepts": {"color": "#06b6d4", "icon": "Lightbulb"},
}

app = FastAPI(title="CodeShelf API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnyBody(BaseModel):
    model_config = {"extra": "allow"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def ensure_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LEETCODE_EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    if not DB_FILE.exists():
        DB_FILE.write_text(json.dumps(seed_database(), indent=2), encoding="utf-8")


def read_db() -> dict[str, Any]:
    ensure_db()
    db = json.loads(DB_FILE.read_text(encoding="utf-8"))
    db.setdefault("shares", [])
    db.setdefault("groups", [])
    db.setdefault("activity", [])
    db.setdefault("leetcodeSyncs", [])
    return db


def write_db(db: dict[str, Any]) -> None:
    DB_FILE.write_text(json.dumps(db, indent=2), encoding="utf-8")


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000, 32).hex()
    return f"{salt}:{digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, original = stored.split(":", 1)
        attempt = hash_password(password, salt).split(":", 1)[1]
        return hmac.compare_digest(bytes.fromhex(original), bytes.fromhex(attempt))
    except Exception:
        return False


def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def sign_token(user_id: str) -> str:
    payload = b64url_encode(json.dumps({"userId": user_id, "exp": int((time.time() + 14 * 86400) * 1000)}).encode())
    signature = b64url_encode(hmac.new(TOKEN_SECRET.encode(), payload.encode(), hashlib.sha256).digest())
    return f"{payload}.{signature}"


def read_token(token: str | None) -> str | None:
    if not token or "." not in token:
        return None
    payload, signature = token.split(".", 1)
    expected = b64url_encode(hmac.new(TOKEN_SECRET.encode(), payload.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(signature, expected):
        return None
    try:
        parsed = json.loads(b64url_decode(payload).decode())
    except Exception:
        return None
    return parsed.get("userId") if parsed.get("exp", 0) > int(time.time() * 1000) else None


def public_user(user: dict[str, Any] | None) -> dict[str, Any] | None:
    if not user:
        return None
    return {key: value for key, value in user.items() if key != "password"}


def get_user_from_header(authorization: str | None = Header(None)) -> dict[str, Any] | None:
    db = read_db()
    token = re.sub(r"^Bearer\s+", "", authorization or "", flags=re.I)
    user_id = read_token(token)
    return next((item for item in db["users"] if item["id"] == user_id), None)


def require_user(user: dict[str, Any] | None = Depends(get_user_from_header)) -> dict[str, Any]:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login required.")
    return user


def make_note(note: dict[str, Any]) -> dict[str, Any]:
    palette = TOPIC_PALETTE.get(note.get("topic"), TOPIC_PALETTE["Concepts"])
    created_at = note.get("createdAt") or now_iso()
    return {
        "id": note.get("id") or str(uuid.uuid4()),
        "title": note.get("title", ""),
        "description": note.get("description", ""),
        "content": note.get("content", ""),
        "topic": note.get("topic", "Concepts"),
        "type": note.get("type", "Note"),
        "difficulty": note.get("difficulty", "Medium"),
        "tags": note.get("tags") or [],
        "images": note.get("images") or [],
        "repo": note.get("repo", ""),
        "visibility": note.get("visibility", "private"),
        "authorId": note.get("authorId"),
        "sharedWith": note.get("sharedWith") or [],
        "groupIds": note.get("groupIds") or [],
        "stats": note.get("stats") or {"views": 0, "likes": 0},
        "color": palette["color"],
        "icon": palette["icon"],
        "createdAt": created_at,
        "updatedAt": note.get("updatedAt") or created_at,
    }


def format_number(value: int | float) -> str:
    value = int(value or 0)
    if value >= 1000:
        return f"{value / 1000:.0f}k" if value >= 10000 else f"{value / 1000:.1f}k"
    return str(value)


def relative_time(value: str | None) -> str:
    try:
        parsed = datetime.fromisoformat((value or "").replace("Z", "+00:00"))
    except ValueError:
        return "today"
    diff = datetime.now(timezone.utc) - parsed
    days = max(0, diff.days)
    if days == 0:
        return "today"
    if days == 1:
        return "1 day ago"
    if days < 7:
        return f"{days} days ago"
    weeks = days // 7
    return "1 week ago" if weeks == 1 else f"{weeks} weeks ago"


def summarize_text(text: str = "", count: int = 3) -> str:
    clean = re.sub(r"```[\s\S]*?```", " ", text)
    clean = re.sub(r"[#>*_`-]", " ", clean)
    sentences = [item.strip() for item in re.split(r"(?<=[.!?])\s+|\n+", clean) if len(item.strip()) > 28]
    return " ".join(sentences[:count]) or clean.strip()[:260]


def display_note(note: dict[str, Any], db: dict[str, Any]) -> dict[str, Any]:
    author = next((item for item in db["users"] if item["id"] == note.get("authorId")), None)
    stats = note.get("stats") or {}
    return {
        **note,
        "author": author.get("name", "Unknown") if author else "Unknown",
        "authorEmail": author.get("email", "") if author else "",
        "timeAgo": relative_time(note.get("createdAt")),
        "views": format_number(stats.get("views", 0)),
        "likes": stats.get("likes", 0),
        "stars": max(12, round(int(stats.get("likes", 0)) * 0.7)),
        "forks": max(3, round(int(stats.get("likes", 0)) * 0.16)),
        "repoUpdated": relative_time(note.get("updatedAt")),
        "summary": summarize_text(note.get("content", ""), 2),
    }


def can_read_note(note: dict[str, Any], user: dict[str, Any] | None, db: dict[str, Any]) -> bool:
    if note.get("visibility") == "public":
        return True
    if not user:
        return False
    if note.get("authorId") == user.get("id"):
        return True
    if user.get("id") in note.get("sharedWith", []):
        return True
    return any(
        group.get("id") in note.get("groupIds", []) and user.get("id") in group.get("memberIds", [])
        for group in db.get("groups", [])
    )


def topic_stats(notes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for index, (name, meta) in enumerate(TOPIC_PALETTE.items(), start=1):
        rows.append({
            "id": index,
            "name": "Data Structures" if name == "DSA" else name,
            "slug": name.lower(),
            "notes": sum(1 for note in notes if note.get("topic") == name or (name == "DSA" and note.get("topic") == "Algorithms")),
            "icon": meta["icon"],
            "color": meta["color"],
        })
    return rows


def concept_recall(query: str, notes: list[dict[str, Any]]) -> str:
    terms = [word for word in re.split(r"\W+", query.lower()) if len(word) > 2]
    scored = []
    for note in notes:
        haystack = f"{note.get('title', '')} {note.get('description', '')} {note.get('content', '')}".lower()
        score = sum(haystack.count(term) for term in terms)
        if score:
            scored.append((score, note))
    if scored:
        note = sorted(scored, key=lambda item: item[0], reverse=True)[0][1]
        return f"Closest match: {note['title']}. {summarize_text(note.get('content', ''), 2)}"
    return f"{query} is not in your current notes yet. Add a note for it, then CodeShelf can recall it from your shelf."


def slugify(value: str = "") -> str:
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", value.lower())) or "leetcode-solution"


def title_from_slug(slug: str = "") -> str:
    return " ".join(part.capitalize() for part in slug.split("-") if part) or "LeetCode Solution"


def deterministic_solution_markdown(payload: dict[str, Any], user: dict[str, Any] | None) -> str:
    title = payload.get("title") or title_from_slug(payload.get("titleSlug", ""))
    language = payload.get("language") or "text"
    url = f"https://leetcode.com/problems/{payload.get('titleSlug')}/" if payload.get("titleSlug") else "Add the LeetCode problem URL"
    complexity = payload.get("complexity") or "- Time: O(n)\n- Space: O(1) or O(n), depending on the data structure used."
    return f"""# {title}

## Problem
- Platform: LeetCode
- Difficulty: {payload.get("difficulty") or "Unknown"}
- Author: {(user or {}).get("name", "CodeShelf User")}
- URL: {url}

## Intuition
{payload.get("approach") or "Write the key observation that makes the solution work."}

## Approach
- Identify the required state or invariant.
- Process the input while preserving that invariant.
- Return the final answer after all updates are complete.

## Complexity
{complexity}

## Code
```{language.lower()}
{payload.get("code") or "// Paste your accepted solution here."}
```

## Edge Cases
- Empty or minimum-size input.
- Duplicate values or repeated states.
- Large inputs near constraint limits.

## Revision Trigger
Explain the invariant first, then the update rule, then the reason it cannot miss a valid answer.
"""


def export_leetcode_markdown(markdown: str, title: str, title_slug: str = "") -> dict[str, Any]:
    file_name = f"{slugify(title_slug or title)}.md"
    local_path = LEETCODE_EXPORT_DIR / file_name
    local_path.write_text(markdown, encoding="utf-8")
    result = {"localPath": str(local_path), "repoPath": "", "pushed": False, "commit": "", "message": "Saved to CodeShelf data folder."}

    repo_root = os.getenv("LEETCODE_REPO_PATH")
    if not repo_root:
        return result

    repo_dir = Path(repo_root) / "data" / "leetcode"
    repo_dir.mkdir(parents=True, exist_ok=True)
    repo_path = repo_dir / file_name
    repo_path.write_text(markdown, encoding="utf-8")
    result.update({"repoPath": str(repo_path), "message": "Saved to the configured repository data folder."})

    if os.getenv("LEETCODE_AUTO_PUSH") == "true" and shutil.which("git"):
        subprocess.run(["git", "add", f"data/leetcode/{file_name}"], cwd=repo_root, check=False, capture_output=True, text=True)
        commit = subprocess.run(["git", "commit", "-m", f"Add LeetCode solution: {title}"], cwd=repo_root, check=False, capture_output=True, text=True)
        if commit.returncode == 0:
            push = subprocess.run(["git", "push"], cwd=repo_root, check=False, capture_output=True, text=True)
            result.update({"pushed": push.returncode == 0, "commit": commit.stdout or commit.stderr})
            result["message"] = "Saved, committed, and pushed to the configured repository." if push.returncode == 0 else "Saved and committed. Git push needs attention."
    return result


def demo_leetcode_profile(username: str = "demo") -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    return {
        "username": username or "demo",
        "realName": "Demo LeetCoder",
        "avatar": "",
        "ranking": 12488,
        "reputation": 42,
        "country": "India",
        "about": "Demo profile for offline CodeShelf development.",
        "totalSolved": 312,
        "totalQuestions": 3480,
        "unsolved": 3168,
        "attempted": 421,
        "acceptanceRate": 74,
        "todaySolved": 2,
        "streak": 9,
        "activeDays": 146,
        "lastActive": now_iso(),
        "difficulty": [
            {"difficulty": "Easy", "solved": 142, "total": 850, "submissions": 164},
            {"difficulty": "Medium", "solved": 139, "total": 1800, "submissions": 212},
            {"difficulty": "Hard", "solved": 31, "total": 830, "submissions": 45},
        ],
        "recentAccepted": [
            {"id": "demo-two-sum", "title": "Two Sum", "titleSlug": "two-sum", "solvedAt": now.isoformat()},
            {"id": "demo-valid-parentheses", "title": "Valid Parentheses", "titleSlug": "valid-parentheses", "solvedAt": (now - timedelta(hours=1)).isoformat()},
            {"id": "demo-product-array", "title": "Product of Array Except Self", "titleSlug": "product-of-array-except-self", "solvedAt": (now - timedelta(days=1)).isoformat()},
        ],
    }


def is_today(value: str) -> bool:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date() == datetime.now(timezone.utc).date()
    except ValueError:
        return False


def seed_database() -> dict[str, Any]:
    now = now_iso()
    password = hash_password("codeshelf123")
    users = [
        {"id": "user_yogender", "name": "Yogender", "email": "yogender@example.com", "password": password, "role": "Owner", "bio": "Building a personal revision library.", "location": "India", "github": "github.com/yogender-ai", "streakCount": 5, "maxStreak": 12, "lastActiveDate": datetime.now().date().isoformat(), "createdAt": now},
        {"id": "user_friend", "name": "Study Friend", "email": "friend@example.com", "password": password, "role": "Collaborator", "bio": "Adds quick explanations and interview questions.", "location": "Remote", "github": "github.com/studyfriend", "streakCount": 1, "maxStreak": 3, "lastActiveDate": datetime.now().date().isoformat(), "createdAt": now},
    ]
    notes = [
        make_note({"id": "note_dsa_dp", "authorId": "user_yogender", "title": "Dynamic Programming Patterns", "topic": "DSA", "type": "Concept", "tags": ["DP", "Memoization", "Interview"], "description": "Core DP recognition rules, state design, transitions, and code templates.", "content": "# Dynamic Programming Patterns\n\nDynamic programming helps when a problem has overlapping subproblems and optimal substructure.", "visibility": "group", "groupIds": ["group_core"], "stats": {"views": 1280, "likes": 132}, "repo": "https://github.com/yogender-ai/dsa-patterns", "createdAt": "2026-05-01T09:30:00.000Z"}),
        make_note({"id": "note_sql_joins", "authorId": "user_yogender", "title": "SQL Joins Explained With Interview Examples", "topic": "SQL", "type": "Note", "tags": ["SQL", "Joins", "Database"], "description": "Inner, left, right, full, self joins, and when to use each in real queries.", "content": "# SQL Joins\n\nJoins combine rows from multiple tables using related columns.", "visibility": "public", "stats": {"views": 950, "likes": 112}, "createdAt": "2026-05-02T13:15:00.000Z"}),
    ]
    return {
        "users": users,
        "notes": notes,
        "groups": [{"id": "group_core", "name": "Core Revision Squad", "description": "DSA, SQL, ML, NLP, and project notes shared with close friends.", "ownerId": "user_yogender", "memberIds": ["user_yogender", "user_friend"], "noteIds": ["note_dsa_dp"], "messages": [], "createdAt": now}],
        "shares": [],
        "leetcodeSyncs": [],
        "activity": [{"id": str(uuid.uuid4()), "userId": "user_yogender", "type": "published", "text": "Dynamic Programming Patterns is live in Core Revision Squad", "createdAt": now}],
    }


@app.get("/")
def root() -> dict[str, Any]:
    return {"ok": True, "message": "CodeShelf FastAPI backend is running"}


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "name": "CodeShelf API", "backend": "FastAPI"}


@app.post("/api/auth/signup", status_code=201)
@app.post("/api/auth/register", status_code=201)
def signup(body: AnyBody) -> dict[str, Any]:
    db = read_db()
    data = body.model_dump()
    email = str(data.get("email", "")).strip().lower()
    if not data.get("name") or not email or not data.get("password"):
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")
    if any(item["email"] == email for item in db["users"]):
        raise HTTPException(status_code=409, detail="Email is already registered.")
    user = {"id": str(uuid.uuid4()), "name": str(data["name"]).strip(), "email": email, "password": hash_password(str(data["password"])), "role": "Contributor", "bio": "", "location": "", "github": "", "streakCount": 1, "maxStreak": 1, "lastActiveDate": datetime.now().date().isoformat(), "createdAt": now_iso()}
    db["users"].append(user)
    write_db(db)
    return {"token": sign_token(user["id"]), "user": public_user(user)}


@app.post("/api/auth/login")
def login(body: AnyBody) -> dict[str, Any]:
    db = read_db()
    data = body.model_dump()
    email = str(data.get("email", "")).strip().lower()
    user = next((item for item in db["users"] if item["email"] == email), None)
    if not user or not verify_password(str(data.get("password", "")), user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"token": sign_token(user["id"]), "user": public_user(user)}


@app.get("/api/auth/me")
def me(user: dict[str, Any] | None = Depends(get_user_from_header)) -> dict[str, Any]:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return {"user": public_user(user)}


@app.get("/api/dashboard")
def dashboard(user: dict[str, Any] | None = Depends(get_user_from_header)) -> dict[str, Any]:
    db = read_db()
    readable = [note for note in db["notes"] if can_read_note(note, user, db)]
    mine = [note for note in readable if user and note.get("authorId") == user.get("id")]
    top_notes = sorted(readable, key=lambda note: note.get("stats", {}).get("likes", 0), reverse=True)[:4]
    needs_review = sorted(mine, key=lambda note: note.get("updatedAt", ""))[:3]
    return {
        "user": public_user(user) or public_user(db["users"][0]),
        "topics": topic_stats(readable),
        "topNotes": [display_note(note, db) for note in top_notes],
        "stats": {
            "notesPublished": len(mine),
            "views": sum(int(note.get("stats", {}).get("views", 0)) for note in mine),
            "likes": sum(int(note.get("stats", {}).get("likes", 0)) for note in mine),
            "reposAdded": sum(1 for note in mine if note.get("repo")),
        },
        "needsReview": [display_note(note, db) for note in needs_review],
        "activity": list(reversed(db.get("activity", [])[-5:])),
        "contributors": [{"id": item["id"], "name": item["name"], "points": format_number(sum(int(note.get("stats", {}).get("likes", 0)) + int(note.get("stats", {}).get("views", 0)) for note in db["notes"] if note.get("authorId") == item["id"])), "rank": index + 1} for index, item in enumerate(db["users"])],
    }


@app.get("/api/notes")
def list_notes(
    search: str = "",
    topic: str = "",
    mine: bool = False,
    groupId: str = "",
    user: dict[str, Any] | None = Depends(get_user_from_header),
) -> dict[str, Any]:
    db = read_db()
    notes = [note for note in db["notes"] if can_read_note(note, user, db)]
    if mine and user:
        notes = [note for note in notes if note.get("authorId") == user.get("id")]
    if topic:
        notes = [note for note in notes if note.get("topic", "").lower() == topic.lower() or topic.lower() in [tag.lower() for tag in note.get("tags", [])]]
    if groupId:
        notes = [note for note in notes if groupId in note.get("groupIds", [])]
    if search:
        needle = search.lower()
        notes = [note for note in notes if needle in f"{note.get('title', '')} {note.get('description', '')} {note.get('topic', '')} {' '.join(note.get('tags', []))} {note.get('content', '')}".lower()]
    notes = sorted(notes, key=lambda note: note.get("updatedAt", ""), reverse=True)
    return {"notes": [display_note(note, db) for note in notes]}


@app.post("/api/notes", status_code=201)
def create_note(body: AnyBody, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    data = body.model_dump()
    if not data.get("title") or not data.get("content") or not data.get("topic"):
        raise HTTPException(status_code=400, detail="Title, topic, and content are required.")
    note = make_note({**data, "id": str(uuid.uuid4()), "authorId": user["id"], "stats": {"views": 0, "likes": 0}})
    db["notes"].append(note)
    for group_id in note.get("groupIds", []):
        group = next((item for item in db["groups"] if item["id"] == group_id and user["id"] in item.get("memberIds", [])), None)
        if group and note["id"] not in group["noteIds"]:
            group["noteIds"].append(note["id"])
    db["activity"].append({"id": str(uuid.uuid4()), "userId": user["id"], "type": "published", "text": f"{note['title']} was added to CodeShelf", "createdAt": now_iso()})
    write_db(db)
    return {"note": display_note(note, db)}


@app.get("/api/notes/{note_id}")
def get_note(note_id: str, user: dict[str, Any] | None = Depends(get_user_from_header)) -> dict[str, Any]:
    db = read_db()
    note = next((item for item in db["notes"] if item["id"] == note_id), None)
    if not note or not can_read_note(note, user, db):
        raise HTTPException(status_code=404, detail="Note not found.")
    note["stats"]["views"] = int(note.get("stats", {}).get("views", 0)) + 1
    write_db(db)
    return {"note": display_note(note, db)}


@app.put("/api/notes/{note_id}")
def update_note(note_id: str, body: AnyBody, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    note = next((item for item in db["notes"] if item["id"] == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    if note.get("authorId") != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this note.")
    data = body.model_dump()
    for key in ["title", "description", "content", "topic", "type", "difficulty", "tags", "images", "visibility", "repo", "groupIds"]:
        if key in data:
            note[key] = data[key]
    note["updatedAt"] = now_iso()
    write_db(db)
    return {"note": display_note(note, db)}


@app.delete("/api/notes/{note_id}")
def delete_note(note_id: str, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    index = next((idx for idx, item in enumerate(db["notes"]) if item["id"] == note_id), -1)
    if index < 0:
        raise HTTPException(status_code=404, detail="Note not found.")
    if db["notes"][index].get("authorId") != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this note.")
    db["notes"].pop(index)
    write_db(db)
    return {"ok": True}


@app.post("/api/notes/{note_id}/like")
def like_note(note_id: str, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    note = next((item for item in db["notes"] if item["id"] == note_id), None)
    if not note or not can_read_note(note, user, db):
        raise HTTPException(status_code=404, detail="Note not found.")
    note["stats"]["likes"] = int(note.get("stats", {}).get("likes", 0)) + 1
    write_db(db)
    return {"note": display_note(note, db)}


@app.post("/api/notes/{note_id}/share")
def share_note(note_id: str, body: AnyBody, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    data = body.model_dump()
    note = next((item for item in db["notes"] if item["id"] == note_id), None)
    if not note or note.get("authorId") != user["id"]:
        raise HTTPException(status_code=404, detail="Only the owner can share this note.")
    target = next((item for item in db["users"] if item["email"] == str(data.get("email", "")).strip().lower()), None)
    if not target:
        raise HTTPException(status_code=404, detail="No user found with that email.")
    if target["id"] not in note["sharedWith"]:
        note["sharedWith"].append(target["id"])
    db["shares"].append({"id": str(uuid.uuid4()), "noteId": note_id, "fromUserId": user["id"], "toUserId": target["id"], "message": data.get("message", ""), "createdAt": now_iso()})
    write_db(db)
    return {"note": display_note(note, db)}


@app.get("/api/groups")
def list_groups(user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    groups = []
    for group in db["groups"]:
        if user["id"] not in group.get("memberIds", []):
            continue
        groups.append({
            **group,
            "members": [public_user(next((item for item in db["users"] if item["id"] == member_id), None)) for member_id in group.get("memberIds", [])],
            "notes": [display_note(note, db) for note in db["notes"] if note.get("id") in group.get("noteIds", [])],
        })
    return {"groups": groups}


@app.post("/api/groups", status_code=201)
def create_group(body: AnyBody, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    data = body.model_dump()
    if not data.get("name"):
        raise HTTPException(status_code=400, detail="Group name is required.")
    group = {"id": str(uuid.uuid4()), "name": str(data["name"]).strip(), "description": str(data.get("description", "")).strip(), "ownerId": user["id"], "memberIds": [user["id"]], "noteIds": [], "messages": [], "createdAt": now_iso()}
    db["groups"].append(group)
    write_db(db)
    return {"group": group}


@app.post("/api/groups/{group_id}/members")
def add_group_member(group_id: str, body: AnyBody, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    group = next((item for item in db["groups"] if item["id"] == group_id and user["id"] in item.get("memberIds", [])), None)
    target = next((item for item in db["users"] if item["email"] == str(body.model_dump().get("email", "")).strip().lower()), None)
    if not group or not target:
        raise HTTPException(status_code=404, detail="Group or user not found.")
    if target["id"] not in group["memberIds"]:
        group["memberIds"].append(target["id"])
    write_db(db)
    return {"group": group}


@app.post("/api/groups/{group_id}/notes")
def add_group_note(group_id: str, body: AnyBody, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    data = body.model_dump()
    group = next((item for item in db["groups"] if item["id"] == group_id and user["id"] in item.get("memberIds", [])), None)
    note = next((item for item in db["notes"] if item["id"] == data.get("noteId") and can_read_note(item, user, db)), None)
    if not group or not note:
        raise HTTPException(status_code=404, detail="Group or note not found.")
    if note["id"] not in group["noteIds"]:
        group["noteIds"].append(note["id"])
    if group["id"] not in note["groupIds"]:
        note["groupIds"].append(group["id"])
    note["visibility"] = "group"
    group["messages"].append({"id": str(uuid.uuid4()), "fromUserId": user["id"], "noteId": note["id"], "text": data.get("message") or "Shared a note with the group.", "createdAt": now_iso()})
    write_db(db)
    return {"group": group, "note": display_note(note, db)}


@app.post("/api/assist/summarize")
def summarize(body: AnyBody, user: dict[str, Any] | None = Depends(get_user_from_header)) -> dict[str, Any]:
    db = read_db()
    data = body.model_dump()
    text = data.get("text", "")
    if data.get("noteId"):
        note = next((item for item in db["notes"] if item["id"] == data["noteId"]), None)
        if not note or not can_read_note(note, user, db):
            raise HTTPException(status_code=404, detail="Note not found.")
        text = note.get("content", "")
    return {"summary": summarize_text(text, int(data.get("count", 3)))}


@app.post("/api/assist/concept")
def concept(body: AnyBody, user: dict[str, Any] | None = Depends(get_user_from_header)) -> dict[str, Any]:
    db = read_db()
    notes = [note for note in db["notes"] if can_read_note(note, user, db)]
    return {"answer": concept_recall(str(body.model_dump().get("query", "")), notes)}


@app.get("/api/leetcode/profile")
def leetcode_profile(username: str = Query("demo")) -> dict[str, Any]:
    return {"profile": demo_leetcode_profile(username)}


@app.post("/api/leetcode/connect")
def leetcode_connect(body: AnyBody, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    profile = demo_leetcode_profile(str(body.model_dump().get("username") or "demo"))
    stored = next(item for item in db["users"] if item["id"] == user["id"])
    stored["leetcodeUsername"] = profile["username"]
    stored["leetcodeProfile"] = {"totalSolved": profile["totalSolved"], "ranking": profile["ranking"], "connectedAt": now_iso()}
    db["activity"].append({"id": str(uuid.uuid4()), "userId": user["id"], "type": "leetcode", "text": f"Connected LeetCode profile @{profile['username']}", "createdAt": now_iso()})
    write_db(db)
    return {"user": public_user(stored), "profile": profile}


@app.post("/api/leetcode/sync")
def leetcode_sync(body: AnyBody, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    data = body.model_dump()
    profile = demo_leetcode_profile(str(data.get("username") or user.get("leetcodeUsername") or "demo"))
    recent = [item for item in profile["recentAccepted"] if not data.get("todayOnly") or is_today(item["solvedAt"])][: max(1, min(int(data.get("limit", 5)), 20))]
    synced, skipped = [], []
    for problem in recent:
        if any(item.get("userId") == user["id"] and item.get("titleSlug") == problem["titleSlug"] for item in db["leetcodeSyncs"]):
            skipped.append(problem)
            continue
        payload = {"title": problem["title"], "titleSlug": problem["titleSlug"], "difficulty": "LeetCode", "language": "Markdown", "approach": f"Accepted on LeetCode by @{profile['username']} on {problem['solvedAt']}.", "code": "", "visibility": data.get("visibility", "private"), "repo": data.get("repo", "")}
        markdown = deterministic_solution_markdown(payload, user)
        export_result = export_leetcode_markdown(markdown, problem["title"], problem["titleSlug"])
        note = make_note({**payload, "id": str(uuid.uuid4()), "authorId": user["id"], "topic": "DSA", "type": "Code Explanation", "tags": ["LeetCode", "DSA"], "content": markdown, "repo": payload.get("repo") or export_result.get("repoPath") or export_result.get("localPath"), "stats": {"views": 0, "likes": 0}})
        db["notes"].append(note)
        db["leetcodeSyncs"].append({"id": str(uuid.uuid4()), "userId": user["id"], "username": profile["username"], "title": problem["title"], "titleSlug": problem["titleSlug"], "noteId": note["id"], "solvedAt": problem["solvedAt"], "exportResult": export_result, "createdAt": now_iso()})
        synced.append({"problem": problem, "note": display_note(note, db), "exportResult": export_result})
    if synced:
        db["activity"].append({"id": str(uuid.uuid4()), "userId": user["id"], "type": "leetcode", "text": f"Synced {len(synced)} LeetCode solutions into CodeShelf", "createdAt": now_iso()})
    write_db(db)
    return {"profile": profile, "synced": synced, "skipped": skipped}


@app.post("/api/leetcode/solution", status_code=201)
def leetcode_solution(body: AnyBody, user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    db = read_db()
    data = body.model_dump()
    if not data.get("title") and not data.get("titleSlug"):
        raise HTTPException(status_code=400, detail="Question title or slug is required.")
    if not data.get("code"):
        raise HTTPException(status_code=400, detail="Paste your accepted solution code first.")
    title = data.get("title") or title_from_slug(data.get("titleSlug", ""))
    markdown = deterministic_solution_markdown(data, user)
    export_result = export_leetcode_markdown(markdown, title, data.get("titleSlug", ""))
    note = make_note({**data, "id": str(uuid.uuid4()), "title": title, "authorId": user["id"], "topic": "DSA", "type": "Code Explanation", "tags": ["LeetCode", data.get("difficulty", "DSA"), data.get("language", "Code")], "content": markdown, "repo": data.get("repo") or export_result.get("repoPath") or export_result.get("localPath"), "stats": {"views": 0, "likes": 0}})
    db["notes"].append(note)
    db["activity"].append({"id": str(uuid.uuid4()), "userId": user["id"], "type": "leetcode", "text": f"Published LeetCode solution: {note['title']}", "createdAt": now_iso()})
    write_db(db)
    return {"note": display_note(note, db), "markdown": markdown, "exportResult": export_result}
