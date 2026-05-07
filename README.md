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

The local database is stored at `backend/data/codeshelf.json`.
