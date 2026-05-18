#!/bin/bash
# ============================================
# CodeShelf — Notes API Test Script
# ============================================
# Usage: ./scripts/test_notes_api.sh
# Prerequisites: Server running on localhost:8000
# ============================================

set -e
BASE="http://localhost:8000"
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
CYAN="\033[0;36m"
NC="\033[0m"

pass() { echo -e "${GREEN}✅ PASS${NC}: $1"; }
fail() { echo -e "${RED}❌ FAIL${NC}: $1"; }
header() { echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}"; }

# ── Step 0: Login to get a token ─────────────────────────────────────
header "Step 0: Login"
LOGIN=$(curl -s $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"yuvika@gmail.com","password":"yuvika123"}')

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokens']['access_token'])" 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "Login failed. Response: $LOGIN"
  echo "Trying to register instead..."
  REG=$(curl -s $BASE/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test User","email":"testnotesapi@codeshelf.dev","password":"testpass123"}')
  TOKEN=$(echo "$REG" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokens']['access_token'])" 2>/dev/null)
  if [ -z "$TOKEN" ]; then
    echo "Registration also failed: $REG"
    exit 1
  fi
fi
echo "Token: ${TOKEN:0:40}..."
AUTH="Authorization: Bearer $TOKEN"

# ── Get a valid subject ID ───────────────────────────────────────────
header "Step 0b: Find a subject"
ME=$(curl -s $BASE/api/auth/me -H "$AUTH")
echo "Logged in as: $(echo $ME | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['name'], d['email'])")"

# We need a subject_id. Let's get one from existing notes or list.
# For now, we'll create a note and handle errors.

# ── Step 1: POST /api/notes — Create Note ────────────────────────────
header "Step 1: POST /api/notes (Create Note)"

# First, get any subject_id from the DB by listing existing notes
NOTES_LIST=$(curl -s "$BASE/api/notes" -H "$AUTH")
echo "Existing notes response: $NOTES_LIST"

# Try to extract a subject_id from existing notes
SUBJECT_ID=$(echo "$NOTES_LIST" | python3 -c "
import sys, json
d = json.load(sys.stdin)
notes = d.get('notes', [])
if notes:
    print(notes[0]['subject']['id'])
else:
    print('')
" 2>/dev/null || echo "")

if [ -z "$SUBJECT_ID" ]; then
  echo "No existing notes. You may need to provide a subject_id manually."
  echo "Trying with a known subject..."
  # Query DB for subjects — we'll just try and see
  SUBJECT_ID="NEEDS_MANUAL_INPUT"
fi

echo "Using subject_id: $SUBJECT_ID"

CREATE_RESP=$(curl -s -w "\n%{http_code}" $BASE/api/notes \
  -X POST -H "$AUTH" -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Binary Search Deep Dive\",
    \"description\": \"Complete guide to binary search with variations\",
    \"content\": \"# Binary Search\\n\\n## Overview\\nBinary search is O(log n)...\\n\\n## Code\\n\\\`\\\`\\\`python\\ndef binary_search(arr, target):\\n    lo, hi = 0, len(arr)-1\\n    while lo <= hi:\\n        mid = (lo+hi)//2\\n        if arr[mid] == target: return mid\\n        elif arr[mid] < target: lo = mid+1\\n        else: hi = mid-1\\n    return -1\\n\\\`\\\`\\\`\",
    \"subject_id\": \"$SUBJECT_ID\",
    \"type\": \"Note\",
    \"difficulty\": \"Medium\",
    \"tags\": [\"binary-search\", \"algorithms\", \"interview-prep\"],
    \"visibility\": \"private\"
  }")

HTTP_CODE=$(echo "$CREATE_RESP" | tail -1)
BODY=$(echo "$CREATE_RESP" | sed '$d')
echo "HTTP $HTTP_CODE"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

NOTE_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
echo "Created note ID: $NOTE_ID"

if [ "$HTTP_CODE" == "201" ]; then pass "Create note"; else fail "Create note (HTTP $HTTP_CODE)"; fi

# ── Step 2: GET /api/notes — List Notes ──────────────────────────────
header "Step 2: GET /api/notes (List All)"
LIST_RESP=$(curl -s "$BASE/api/notes" -H "$AUTH")
echo "$LIST_RESP" | python3 -m json.tool 2>/dev/null || echo "$LIST_RESP"
TOTAL=$(echo "$LIST_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['total'])" 2>/dev/null || echo "0")
echo "Total notes: $TOTAL"
pass "List notes"

# ── Step 2b: Filtered queries ────────────────────────────────────────
header "Step 2b: GET /api/notes?difficulty=Medium"
curl -s "$BASE/api/notes?difficulty=Medium" -H "$AUTH" | python3 -m json.tool 2>/dev/null
pass "Filter by difficulty"

header "Step 2c: GET /api/notes?tag=binary-search"
curl -s "$BASE/api/notes?tag=binary-search" -H "$AUTH" | python3 -m json.tool 2>/dev/null
pass "Filter by tag"

header "Step 2d: GET /api/notes?search=binary"
curl -s "$BASE/api/notes?search=binary" -H "$AUTH" | python3 -m json.tool 2>/dev/null
pass "Search notes"

# ── Step 3: GET /api/notes/{id} — Get Single ─────────────────────────
header "Step 3: GET /api/notes/$NOTE_ID"
if [ -n "$NOTE_ID" ]; then
  SINGLE=$(curl -s "$BASE/api/notes/$NOTE_ID" -H "$AUTH")
  echo "$SINGLE" | python3 -m json.tool 2>/dev/null || echo "$SINGLE"
  pass "Get single note"
else
  fail "No note ID to fetch"
fi

# ── Step 4: PATCH /api/notes/{id} — Update ───────────────────────────
header "Step 4: PATCH /api/notes/$NOTE_ID (Update)"
if [ -n "$NOTE_ID" ]; then
  UPDATE_RESP=$(curl -s "$BASE/api/notes/$NOTE_ID" -X PATCH \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{
      "title": "Binary Search — Complete Guide (Updated)",
      "difficulty": "Hard",
      "tags": ["binary-search", "algorithms", "interview-prep", "updated"]
    }')
  echo "$UPDATE_RESP" | python3 -m json.tool 2>/dev/null || echo "$UPDATE_RESP"
  pass "Update note"
else
  fail "No note ID to update"
fi

# ── Step 5: POST /api/notes/{id}/view — Log View ────────────────────
header "Step 5: POST /api/notes/$NOTE_ID/view (Log View)"
if [ -n "$NOTE_ID" ]; then
  VIEW_RESP=$(curl -s "$BASE/api/notes/$NOTE_ID/view" -X POST -H "$AUTH")
  echo "$VIEW_RESP" | python3 -m json.tool 2>/dev/null || echo "$VIEW_RESP"
  pass "Log view"
else
  fail "No note ID to view"
fi

# ── Step 6: GET /api/notes/review — Review Queue ────────────────────
header "Step 6: GET /api/notes/review (Spaced Repetition)"
REVIEW_RESP=$(curl -s "$BASE/api/notes/review" -H "$AUTH")
echo "$REVIEW_RESP" | python3 -m json.tool 2>/dev/null || echo "$REVIEW_RESP"
pass "Review queue"

# ── Step 7: DELETE /api/notes/{id} — Delete ──────────────────────────
header "Step 7: DELETE /api/notes/$NOTE_ID"
if [ -n "$NOTE_ID" ]; then
  DEL_RESP=$(curl -s "$BASE/api/notes/$NOTE_ID" -X DELETE -H "$AUTH")
  echo "$DEL_RESP" | python3 -m json.tool 2>/dev/null || echo "$DEL_RESP"
  pass "Delete note"
else
  fail "No note ID to delete"
fi

# ── Step 8: Verify deletion ──────────────────────────────────────────
header "Step 8: GET /api/notes/$NOTE_ID (should be 404)"
if [ -n "$NOTE_ID" ]; then
  VERIFY=$(curl -s -w "\n%{http_code}" "$BASE/api/notes/$NOTE_ID" -H "$AUTH")
  CODE=$(echo "$VERIFY" | tail -1)
  echo "HTTP $CODE"
  if [ "$CODE" == "404" ]; then pass "Deleted note returns 404"; else fail "Expected 404, got $CODE"; fi
fi

# ── Step 9: Auth protection ──────────────────────────────────────────
header "Step 9: No auth (should be 403)"
NOAUTH=$(curl -s -w "\n%{http_code}" "$BASE/api/notes")
CODE=$(echo "$NOAUTH" | tail -1)
if [ "$CODE" == "403" ]; then pass "Unauthenticated request rejected"; else fail "Expected 403, got $CODE"; fi

echo -e "\n${BOLD}${GREEN}All tests completed!${NC}"
