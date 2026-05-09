# CodeShelf

CodeShelf is a personal and collaborative study platform for DSA, SQL, ML, NLP, project notes, code snippets, explanations, images, summaries, and fast concept recall.

## Run locally

```bash
npm run dev:api
npm run dev
```

Frontend: `http://127.0.0.1:5173`

API: `http://localhost:4200/api`

Demo login:

- Email: `yogender@example.com`
- Password: `codeshelf123`

## Backend Features

- Email/password auth with signed local tokens
- Notes with markdown text, code blocks, repo links, tags, topics, and image data
- Public, private, and group visibility
- Friend sharing by email
- Study groups with members and shared notes
- Search by title, topic, tag, content, and code
- Offline summaries and instant concept recall
- LeetCode profile sync, recent accepted import, solution Markdown publishing, and optional repo export

## LeetCode Sync

Open `/leetcode`, connect a LeetCode username, and sync recent accepted problems into CodeShelf notes. Use username `demo` for an offline sample profile.

Accepted problems and published solutions are saved as Markdown in `backend/data/leetcode`. To also write them into another local git repo, start the API with:

```bash
LEETCODE_REPO_PATH=/path/to/your/repo LEETCODE_AUTO_PUSH=true npm run dev:api
```

PowerShell:

```powershell
$env:LEETCODE_REPO_PATH="A:\path\to\your\repo"; $env:LEETCODE_AUTO_PUSH="true"; npm run dev:api
```

When `OPENROUTER_API_KEY` or `GEMINI_API_KEY` is set, CodeShelf asks the model to format solution posts into a cleaner `.md` structure. Without keys, it uses the built-in Markdown template.

The local database is stored at `backend/data/codeshelf.json`.
