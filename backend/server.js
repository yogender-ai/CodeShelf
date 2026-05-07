import { createHmac, pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DB_FILE = join(DATA_DIR, 'codeshelf.json')
const PORT = Number(process.env.PORT || 4200)
const TOKEN_SECRET = process.env.CODESHELF_SECRET || 'codeshelf-local-dev-secret'

const topicPalette = {
  DSA: { color: '#8b5cf6', icon: 'Code' },
  SQL: { color: '#10b981', icon: 'Database' },
  ML: { color: '#3b82f6', icon: 'Sparkles' },
  NLP: { color: '#ec4899', icon: 'FileText' },
  Projects: { color: '#f59e0b', icon: 'GitBranch' },
  Concepts: { color: '#06b6d4', icon: 'Lightbulb' },
}

function seedDatabase() {
  const now = new Date().toISOString()
  const demoPassword = hashPassword('codeshelf123')
  const users = [
    {
      id: 'user_yogender',
      name: 'Yogender',
      email: 'yogender@example.com',
      password: demoPassword,
      role: 'Owner',
      bio: 'Building a personal revision library for DSA, SQL, ML, NLP, projects, and code explanations.',
      location: 'India',
      github: 'github.com/yogender-ai',
      createdAt: now,
    },
    {
      id: 'user_friend',
      name: 'Study Friend',
      email: 'friend@example.com',
      password: demoPassword,
      role: 'Collaborator',
      bio: 'Adds quick explanations and interview questions.',
      location: 'Remote',
      github: 'github.com/studyfriend',
      createdAt: now,
    },
  ]

  const notes = [
    makeNote({
      id: 'note_dsa_dp',
      authorId: users[0].id,
      title: 'Dynamic Programming Patterns',
      topic: 'DSA',
      type: 'Concept',
      tags: ['DP', 'Memoization', 'Interview'],
      description: 'Core DP recognition rules, state design, transitions, and code templates.',
      content: `# Dynamic Programming Patterns

Dynamic programming helps when a problem has overlapping subproblems and optimal substructure.

## How to recognize
- Choices repeat across indexes, capacities, masks, or strings.
- Brute force recursion recomputes the same state.
- The answer can be expressed from smaller answers.

## State design
\`dp[i]\` means the best answer using prefix \`0..i\`.
\`dp[i][j]\` often compares two sequences or tracks capacity.

\`\`\`cpp
int climbStairs(int n) {
  vector<int> dp(n + 1);
  dp[0] = 1;
  dp[1] = 1;
  for (int i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}
\`\`\`

Revision trigger: define state first, then transition, then base cases.`,
      visibility: 'group',
      groupIds: ['group_core'],
      stats: { views: 1280, likes: 132 },
      repo: 'https://github.com/yogender-ai/dsa-patterns',
      createdAt: '2026-05-01T09:30:00.000Z',
    }),
    makeNote({
      id: 'note_sql_joins',
      authorId: users[0].id,
      title: 'SQL Joins Explained With Interview Examples',
      topic: 'SQL',
      type: 'Note',
      tags: ['SQL', 'Joins', 'Database'],
      description: 'Inner, left, right, full, self joins, and when to use each in real queries.',
      content: `# SQL Joins

Joins combine rows from multiple tables using related columns.

## Inner Join
Returns only matching rows from both tables.

\`\`\`sql
SELECT e.name, d.name AS department
FROM employees e
INNER JOIN departments d ON d.id = e.department_id;
\`\`\`

## Left Join
Keeps every row from the left table and fills missing right side columns with NULL.

Common interview point: use LEFT JOIN with \`WHERE right_table.id IS NULL\` to find missing relationships.`,
      visibility: 'public',
      stats: { views: 950, likes: 112 },
      createdAt: '2026-05-02T13:15:00.000Z',
    }),
    makeNote({
      id: 'note_ml_bias_variance',
      authorId: users[1].id,
      title: 'Bias Variance Tradeoff',
      topic: 'ML',
      type: 'Concept',
      tags: ['ML', 'Generalization', 'Models'],
      description: 'A quick revision note for underfitting, overfitting, and model complexity.',
      content: `# Bias Variance Tradeoff

High bias means the model is too simple and underfits. High variance means the model follows noise and overfits.

Reduce bias with richer features, stronger models, or lower regularization. Reduce variance with more data, cross validation, regularization, pruning, or ensembling.

Walking revision: underfit misses train and test; overfit wins train but loses test.`,
      visibility: 'group',
      groupIds: ['group_core'],
      stats: { views: 420, likes: 58 },
      createdAt: '2026-05-03T08:00:00.000Z',
    }),
    makeNote({
      id: 'note_nlp_attention',
      authorId: users[0].id,
      title: 'Attention Mechanism in NLP',
      topic: 'NLP',
      type: 'Note',
      tags: ['NLP', 'Transformers', 'Attention'],
      description: 'What queries, keys, values, and scaled dot-product attention mean.',
      content: `# Attention

Attention lets each token decide which other tokens matter for its representation.

Queries ask what a token is looking for. Keys describe what each token offers. Values contain the information to mix after relevance is calculated.

\`\`\`text
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V
\`\`\`

Use this sentence while revising: query asks, key matches, value answers.`,
      visibility: 'private',
      stats: { views: 300, likes: 44 },
      createdAt: '2026-05-04T11:45:00.000Z',
    }),
    makeNote({
      id: 'note_project_codeshelf',
      authorId: users[0].id,
      title: 'CodeShelf Project Architecture',
      topic: 'Projects',
      type: 'Project',
      tags: ['React', 'Backend', 'Notes'],
      description: 'Product notes for auth, note blocks, groups, sharing, and instant concept search.',
      content: `# CodeShelf Architecture

Frontend handles fast note capture and revision views. Backend owns users, notes, groups, sharing, and summary/search helpers.

Core entities:
- User
- Note
- Group
- GroupMessage
- SharedNote

Important UX: search should answer concept recall immediately, not only return document links.`,
      visibility: 'group',
      groupIds: ['group_core'],
      stats: { views: 180, likes: 25 },
      repo: 'https://github.com/yogender-ai/codeshelf',
      createdAt: '2026-05-05T16:30:00.000Z',
    }),
  ]

  return {
    users,
    notes,
    groups: [
      {
        id: 'group_core',
        name: 'Core Revision Squad',
        description: 'DSA, SQL, ML, NLP, and project notes shared with close friends.',
        ownerId: users[0].id,
        memberIds: users.map((user) => user.id),
        noteIds: notes.filter((note) => note.groupIds.includes('group_core')).map((note) => note.id),
        messages: [
          {
            id: randomUUID(),
            fromUserId: users[1].id,
            noteId: 'note_ml_bias_variance',
            text: 'Added a short walking-revision version for bias variance.',
            createdAt: now,
          },
        ],
        createdAt: now,
      },
    ],
    shares: [],
    activity: [
      { id: randomUUID(), userId: users[0].id, type: 'published', text: 'Dynamic Programming Patterns is live in Core Revision Squad', createdAt: now },
      { id: randomUUID(), userId: users[0].id, type: 'group', text: 'Study Friend joined Core Revision Squad', createdAt: now },
    ],
  }
}

function makeNote(note) {
  const palette = topicPalette[note.topic] || topicPalette.Concepts
  return {
    id: note.id || randomUUID(),
    title: note.title,
    description: note.description,
    content: note.content,
    topic: note.topic,
    type: note.type || 'Note',
    tags: note.tags || [],
    images: note.images || [],
    repo: note.repo || '',
    visibility: note.visibility || 'private',
    authorId: note.authorId,
    sharedWith: note.sharedWith || [],
    groupIds: note.groupIds || [],
    stats: note.stats || { views: 0, likes: 0 },
    color: palette.color,
    icon: palette.icon,
    createdAt: note.createdAt || new Date().toISOString(),
    updatedAt: note.updatedAt || note.createdAt || new Date().toISOString(),
  }
}

function ensureDb() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(DB_FILE)) writeFileSync(DB_FILE, JSON.stringify(seedDatabase(), null, 2))
}

function readDb() {
  ensureDb()
  return JSON.parse(readFileSync(DB_FILE, 'utf8'))
}

function writeDb(db) {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, original] = stored.split(':')
  const attempt = hashPassword(password, salt).split(':')[1]
  return timingSafeEqual(Buffer.from(original, 'hex'), Buffer.from(attempt, 'hex'))
}

function signToken(userId) {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 14 })).toString('base64url')
  const sig = createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

function readToken(token) {
  if (!token || !token.includes('.')) return null
  const [payload, sig] = token.split('.')
  const expected = createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url')
  if (sig !== expected) return null
  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  return parsed.exp > Date.now() ? parsed.userId : null
}

function publicUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

function displayNote(note, db) {
  const author = db.users.find((user) => user.id === note.authorId)
  return {
    ...note,
    author: author?.name || 'Unknown',
    authorEmail: author?.email || '',
    timeAgo: relativeTime(note.createdAt),
    views: formatNumber(note.stats.views),
    likes: note.stats.likes,
    stars: Math.max(12, Math.round(note.stats.likes * 0.7)),
    forks: Math.max(3, Math.round(note.stats.likes * 0.16)),
    repoUpdated: relativeTime(note.updatedAt),
    summary: summarizeText(note.content, 2),
  }
}

function relativeTime(value) {
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.max(0, Math.floor(diff / 86400000))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
}

function formatNumber(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return String(value)
}

function canReadNote(note, user, db) {
  if (note.visibility === 'public') return true
  if (!user) return false
  if (note.authorId === user.id) return true
  if (note.sharedWith.includes(user.id)) return true
  return note.groupIds.some((groupId) => db.groups.some((group) => group.id === groupId && group.memberIds.includes(user.id)))
}

function requireUser(req, db) {
  const header = req.headers.authorization || ''
  const userId = readToken(header.replace(/^Bearer\s+/i, ''))
  return db.users.find((user) => user.id === userId) || null
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 10_000_000) req.destroy()
    })
    req.on('end', () => {
      if (!body) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
  })
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  })
  res.end(JSON.stringify(data))
}

function summarizeText(text = '', count = 3) {
  const clean = text.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`-]/g, ' ')
  const sentences = clean.split(/(?<=[.!?])\s+|\n+/).map((item) => item.trim()).filter((item) => item.length > 28)
  return sentences.slice(0, count).join(' ') || clean.trim().slice(0, 260)
}

function conceptRecall(query, notes) {
  const terms = query.toLowerCase().split(/\W+/).filter((word) => word.length > 2)
  const scored = notes
    .map((note) => {
      const haystack = `${note.title} ${note.description} ${note.topic} ${note.tags.join(' ')} ${note.content}`.toLowerCase()
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0)
      return { note, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  const best = scored[0]?.note
  if (!best) return { answer: 'No matching concept found yet. Add a note for this topic and it will appear here next time.', matches: [] }
  return {
    answer: summarizeText(best.content, 2),
    matches: scored.slice(0, 5).map((item) => item.note),
  }
}

function topicStats(notes) {
  return Object.entries(topicPalette).map(([name, meta], index) => ({
    id: index + 1,
    name: name === 'DSA' ? 'Data Structures' : name,
    slug: name.toLowerCase(),
    notes: notes.filter((note) => note.topic === name || (name === 'DSA' && note.topic === 'Algorithms')).length,
    icon: meta.icon,
    color: meta.color,
  }))
}

async function route(req, res) {
  if (req.method === 'OPTIONS') return send(res, 200, {})

  const db = readDb()
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname
  const user = requireUser(req, db)

  try {
    if (path === '/api/health') return send(res, 200, { ok: true, name: 'CodeShelf API' })

    if (path === '/api/auth/signup' && req.method === 'POST') {
      const body = await parseBody(req)
      const email = String(body.email || '').trim().toLowerCase()
      if (!body.name || !email || !body.password) return send(res, 400, { error: 'Name, email, and password are required.' })
      if (db.users.some((item) => item.email === email)) return send(res, 409, { error: 'Email is already registered.' })
      const newUser = {
        id: randomUUID(),
        name: String(body.name).trim(),
        email,
        password: hashPassword(String(body.password)),
        role: 'Contributor',
        bio: '',
        location: '',
        github: '',
        createdAt: new Date().toISOString(),
      }
      db.users.push(newUser)
      writeDb(db)
      return send(res, 201, { token: signToken(newUser.id), user: publicUser(newUser) })
    }

    if (path === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req)
      const found = db.users.find((item) => item.email === String(body.email || '').trim().toLowerCase())
      if (!found || !verifyPassword(String(body.password || ''), found.password)) return send(res, 401, { error: 'Invalid email or password.' })
      return send(res, 200, { token: signToken(found.id), user: publicUser(found) })
    }

    if (path === '/api/auth/me' && req.method === 'GET') {
      return user ? send(res, 200, { user: publicUser(user) }) : send(res, 401, { error: 'Not authenticated.' })
    }

    if (path === '/api/dashboard' && req.method === 'GET') {
      const readable = db.notes.filter((note) => canReadNote(note, user, db))
      const mine = user ? readable.filter((note) => note.authorId === user.id) : []
      return send(res, 200, {
        user: user ? publicUser(user) : publicUser(db.users[0]),
        topics: topicStats(readable),
        topNotes: readable.sort((a, b) => b.stats.likes - a.stats.likes).slice(0, 4).map((note) => displayNote(note, db)),
        stats: {
          notesPublished: mine.length,
          views: mine.reduce((total, note) => total + note.stats.views, 0),
          likes: mine.reduce((total, note) => total + note.stats.likes, 0),
          reposAdded: mine.filter((note) => note.repo).length,
        },
        activity: db.activity.slice(-5).reverse(),
        contributors: db.users.map((item, index) => ({
          id: item.id,
          name: item.name,
          points: formatNumber(db.notes.filter((note) => note.authorId === item.id).reduce((total, note) => total + note.stats.likes + note.stats.views, 0)),
          rank: index + 1,
        })),
      })
    }

    if (path === '/api/notes' && req.method === 'GET') {
      const search = (url.searchParams.get('search') || '').toLowerCase()
      const topic = url.searchParams.get('topic')
      const mine = url.searchParams.get('mine') === 'true'
      const groupId = url.searchParams.get('groupId')
      let notes = db.notes.filter((note) => canReadNote(note, user, db))
      if (mine && user) notes = notes.filter((note) => note.authorId === user.id)
      if (topic) notes = notes.filter((note) => note.topic.toLowerCase() === topic.toLowerCase() || note.tags.some((tag) => tag.toLowerCase() === topic.toLowerCase()))
      if (groupId) notes = notes.filter((note) => note.groupIds.includes(groupId))
      if (search) {
        notes = notes.filter((note) => `${note.title} ${note.description} ${note.topic} ${note.tags.join(' ')} ${note.content}`.toLowerCase().includes(search))
      }
      return send(res, 200, { notes: notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map((note) => displayNote(note, db)) })
    }

    if (path === '/api/notes' && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Login required.' })
      const body = await parseBody(req)
      if (!body.title || !body.content || !body.topic) return send(res, 400, { error: 'Title, topic, and content are required.' })
      const note = makeNote({
        ...body,
        id: randomUUID(),
        authorId: user.id,
        tags: Array.isArray(body.tags) ? body.tags : [],
        images: Array.isArray(body.images) ? body.images : [],
        groupIds: Array.isArray(body.groupIds) ? body.groupIds : [],
        stats: { views: 0, likes: 0 },
      })
      db.notes.push(note)
      for (const groupId of note.groupIds) {
        const group = db.groups.find((item) => item.id === groupId && item.memberIds.includes(user.id))
        if (group && !group.noteIds.includes(note.id)) group.noteIds.push(note.id)
      }
      db.activity.push({ id: randomUUID(), userId: user.id, type: 'published', text: `${note.title} was added to CodeShelf`, createdAt: new Date().toISOString() })
      writeDb(db)
      return send(res, 201, { note: displayNote(note, db) })
    }

    const noteMatch = path.match(/^\/api\/notes\/([^/]+)$/)
    if (noteMatch && req.method === 'GET') {
      const note = db.notes.find((item) => item.id === noteMatch[1])
      if (!note || !canReadNote(note, user, db)) return send(res, 404, { error: 'Note not found.' })
      note.stats.views += 1
      writeDb(db)
      return send(res, 200, { note: displayNote(note, db) })
    }

    if (path.match(/^\/api\/notes\/([^/]+)\/like$/) && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Login required.' })
      const noteId = path.split('/')[3]
      const note = db.notes.find((item) => item.id === noteId)
      if (!note || !canReadNote(note, user, db)) return send(res, 404, { error: 'Note not found.' })
      note.stats.likes += 1
      writeDb(db)
      return send(res, 200, { note: displayNote(note, db) })
    }

    if (path.match(/^\/api\/notes\/([^/]+)\/share$/) && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Login required.' })
      const noteId = path.split('/')[3]
      const body = await parseBody(req)
      const note = db.notes.find((item) => item.id === noteId)
      if (!note || note.authorId !== user.id) return send(res, 404, { error: 'Only the owner can share this note.' })
      const target = db.users.find((item) => item.email === String(body.email || '').trim().toLowerCase())
      if (!target) return send(res, 404, { error: 'No user found with that email.' })
      if (!note.sharedWith.includes(target.id)) note.sharedWith.push(target.id)
      db.shares.push({ id: randomUUID(), noteId, fromUserId: user.id, toUserId: target.id, message: body.message || '', createdAt: new Date().toISOString() })
      writeDb(db)
      return send(res, 200, { note: displayNote(note, db) })
    }

    if (path === '/api/groups' && req.method === 'GET') {
      if (!user) return send(res, 401, { error: 'Login required.' })
      const groups = db.groups.filter((group) => group.memberIds.includes(user.id)).map((group) => ({
        ...group,
        members: group.memberIds.map((memberId) => publicUser(db.users.find((item) => item.id === memberId))).filter(Boolean),
        notes: group.noteIds.map((noteId) => db.notes.find((note) => note.id === noteId)).filter(Boolean).map((note) => displayNote(note, db)),
      }))
      return send(res, 200, { groups })
    }

    if (path === '/api/groups' && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Login required.' })
      const body = await parseBody(req)
      if (!body.name) return send(res, 400, { error: 'Group name is required.' })
      const group = {
        id: randomUUID(),
        name: String(body.name).trim(),
        description: String(body.description || '').trim(),
        ownerId: user.id,
        memberIds: [user.id],
        noteIds: [],
        messages: [],
        createdAt: new Date().toISOString(),
      }
      db.groups.push(group)
      writeDb(db)
      return send(res, 201, { group })
    }

    if (path.match(/^\/api\/groups\/([^/]+)\/members$/) && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Login required.' })
      const groupId = path.split('/')[3]
      const body = await parseBody(req)
      const group = db.groups.find((item) => item.id === groupId && item.memberIds.includes(user.id))
      const target = db.users.find((item) => item.email === String(body.email || '').trim().toLowerCase())
      if (!group || !target) return send(res, 404, { error: 'Group or user not found.' })
      if (!group.memberIds.includes(target.id)) group.memberIds.push(target.id)
      writeDb(db)
      return send(res, 200, { group })
    }

    if (path.match(/^\/api\/groups\/([^/]+)\/notes$/) && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Login required.' })
      const groupId = path.split('/')[3]
      const body = await parseBody(req)
      const group = db.groups.find((item) => item.id === groupId && item.memberIds.includes(user.id))
      const note = db.notes.find((item) => item.id === body.noteId && canReadNote(item, user, db))
      if (!group || !note) return send(res, 404, { error: 'Group or note not found.' })
      if (!group.noteIds.includes(note.id)) group.noteIds.push(note.id)
      if (!note.groupIds.includes(group.id)) note.groupIds.push(group.id)
      note.visibility = 'group'
      group.messages.push({ id: randomUUID(), fromUserId: user.id, noteId: note.id, text: body.message || 'Shared a note with the group.', createdAt: new Date().toISOString() })
      writeDb(db)
      return send(res, 200, { group, note: displayNote(note, db) })
    }

    if (path === '/api/assist/summarize' && req.method === 'POST') {
      const body = await parseBody(req)
      let text = body.text || ''
      if (body.noteId) {
        const note = db.notes.find((item) => item.id === body.noteId)
        if (!note || !canReadNote(note, user, db)) return send(res, 404, { error: 'Note not found.' })
        text = note.content
      }
      return send(res, 200, { summary: summarizeText(text, Number(body.count || 3)) })
    }

    if (path === '/api/assist/concept' && req.method === 'POST') {
      const body = await parseBody(req)
      const readable = db.notes.filter((note) => canReadNote(note, user, db))
      const result = conceptRecall(String(body.query || ''), readable)
      return send(res, 200, { answer: result.answer, matches: result.matches.map((note) => displayNote(note, db)) })
    }

    return send(res, 404, { error: 'Route not found.' })
  } catch (error) {
    return send(res, 500, { error: error.message || 'Server error.' })
  }
}

ensureDb()
http.createServer(route).listen(PORT, () => {
  console.log(`CodeShelf API running at http://localhost:${PORT}`)
})
