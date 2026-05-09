import { createHmac, pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import http from 'node:http'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DB_FILE = join(DATA_DIR, 'codeshelf.json')
const LEETCODE_EXPORT_DIR = join(DATA_DIR, 'leetcode')
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
    leetcodeSyncs: [],
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
  if (!existsSync(LEETCODE_EXPORT_DIR)) mkdirSync(LEETCODE_EXPORT_DIR, { recursive: true })
  if (!existsSync(DB_FILE)) writeFileSync(DB_FILE, JSON.stringify(seedDatabase(), null, 2))
}

function readDb() {
  ensureDb()
  const db = JSON.parse(readFileSync(DB_FILE, 'utf8'))
  if (!Array.isArray(db.leetcodeSyncs)) db.leetcodeSyncs = []
  return db
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

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'leetcode-solution'
}

function sameLocalDate(timestampSeconds, date = new Date()) {
  const solved = new Date(Number(timestampSeconds) * 1000)
  return solved.getFullYear() === date.getFullYear()
    && solved.getMonth() === date.getMonth()
    && solved.getDate() === date.getDate()
}

function statCount(stats = [], difficulty = 'All') {
  return stats.find((item) => item.difficulty === difficulty)?.count || 0
}

async function fetchLeetCodeProfile(username) {
  const cleanUsername = String(username || '').trim()
  if (!cleanUsername) throw new Error('LeetCode username is required.')

  if (cleanUsername.toLowerCase() === 'demo') return demoLeetCodeProfile()

  const query = `
    query CodeShelfLeetCodeProfile($username: String!, $limit: Int!) {
      allQuestionsCount {
        difficulty
        count
      }
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
          reputation
          aboutMe
          countryName
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        userCalendar {
          streak
          totalActiveDays
          submissionCalendar
        }
      }
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `

  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
      'User-Agent': 'CodeShelf LeetCode Sync',
    },
    body: JSON.stringify({ query, variables: { username: cleanUsername, limit: 20 } }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || 'Could not reach LeetCode right now.')
  }
  if (!payload.data?.matchedUser) throw new Error('No LeetCode profile found for that username.')
  return normalizeLeetCodeProfile(payload.data)
}

function normalizeLeetCodeProfile(data) {
  const user = data.matchedUser
  const profile = user.profile || {}
  const accepted = user.submitStatsGlobal?.acSubmissionNum || []
  const submitted = user.submitStatsGlobal?.totalSubmissionNum || []
  const totals = data.allQuestionsCount || []
  const totalSolved = statCount(accepted, 'All')
  const totalQuestions = statCount(totals, 'All')
  const recentAccepted = uniqueRecentSubmissions(data.recentAcSubmissionList || [])
  const todaySolved = recentAccepted.filter((item) => sameLocalDate(item.timestamp)).length
  const submissionCalendar = safeJson(user.userCalendar?.submissionCalendar, {})
  const activeDays = Object.keys(submissionCalendar)
    .map((stamp) => ({ date: new Date(Number(stamp) * 1000).toISOString(), count: submissionCalendar[stamp] }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return {
    username: user.username,
    realName: profile.realName || user.username,
    avatar: profile.userAvatar || '',
    ranking: profile.ranking || null,
    reputation: profile.reputation || 0,
    country: profile.countryName || '',
    about: stripHtml(profile.aboutMe || ''),
    totalSolved,
    totalQuestions,
    unsolved: Math.max(0, totalQuestions - totalSolved),
    attempted: statCount(submitted, 'All'),
    acceptanceRate: statCount(submitted, 'All') ? Math.round((totalSolved / statCount(submitted, 'All')) * 100) : 0,
    todaySolved,
    streak: user.userCalendar?.streak || 0,
    activeDays: user.userCalendar?.totalActiveDays || 0,
    lastActive: activeDays[0]?.date || null,
    difficulty: ['Easy', 'Medium', 'Hard'].map((difficulty) => ({
      difficulty,
      solved: statCount(accepted, difficulty),
      total: statCount(totals, difficulty),
      submissions: submitted.find((item) => item.difficulty === difficulty)?.submissions || 0,
    })),
    recentAccepted: recentAccepted.map((item) => ({
      id: item.id,
      title: item.title,
      titleSlug: item.titleSlug,
      solvedAt: new Date(Number(item.timestamp) * 1000).toISOString(),
    })),
  }
}

function uniqueRecentSubmissions(submissions) {
  const seen = new Set()
  return submissions.filter((item) => {
    if (seen.has(item.titleSlug)) return false
    seen.add(item.titleSlug)
    return true
  })
}

function safeJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function stripHtml(value) {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function demoLeetCodeProfile() {
  const nowSeconds = Math.floor(Date.now() / 1000)
  return {
    username: 'demo',
    realName: 'Demo LeetCoder',
    avatar: '',
    ranking: 12488,
    reputation: 42,
    country: 'India',
    about: 'Demo profile for offline CodeShelf development.',
    totalSolved: 312,
    totalQuestions: 3480,
    unsolved: 3168,
    attempted: 421,
    acceptanceRate: 74,
    todaySolved: 2,
    streak: 9,
    activeDays: 146,
    lastActive: new Date().toISOString(),
    difficulty: [
      { difficulty: 'Easy', solved: 142, total: 850, submissions: 164 },
      { difficulty: 'Medium', solved: 139, total: 1800, submissions: 212 },
      { difficulty: 'Hard', solved: 31, total: 830, submissions: 45 },
    ],
    recentAccepted: [
      { id: 'demo-two-sum', title: 'Two Sum', titleSlug: 'two-sum', solvedAt: new Date(nowSeconds * 1000).toISOString() },
      { id: 'demo-valid-parentheses', title: 'Valid Parentheses', titleSlug: 'valid-parentheses', solvedAt: new Date((nowSeconds - 3600) * 1000).toISOString() },
      { id: 'demo-product-array', title: 'Product of Array Except Self', titleSlug: 'product-of-array-except-self', solvedAt: new Date((nowSeconds - 86400) * 1000).toISOString() },
    ],
  }
}

async function buildSolutionMarkdown(payload, user) {
  const fallback = deterministicSolutionMarkdown(payload, user)
  const prompt = `Create a polished Markdown LeetCode solution note for CodeShelf.
Question: ${payload.title}
Difficulty: ${payload.difficulty || 'Unknown'}
Language: ${payload.language || 'Code'}
Approach notes: ${payload.approach || 'Explain the approach clearly.'}
Complexity: ${payload.complexity || 'Infer from the code if possible.'}
Code:
\`\`\`${payload.language || ''}
${payload.code || ''}
\`\`\`

Return only Markdown. Use sections: Problem, Intuition, Approach, Complexity, Code, Edge Cases, Revision Trigger.`

  const aiMarkdown = await askAiForMarkdown(prompt).catch(() => '')
  return cleanMarkdownResponse(aiMarkdown) || fallback
}

async function askAiForMarkdown(prompt) {
  if (process.env.OPENROUTER_API_KEY) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.CODE_SHELF_URL || 'http://localhost:5173',
        'X-Title': 'CodeShelf',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/auto',
        messages: [
          { role: 'system', content: 'You write concise, correct Markdown programming notes for interview revision.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error?.message || 'OpenRouter request failed.')
    return data.choices?.[0]?.message?.content || ''
  }

  if (process.env.GEMINI_API_KEY) {
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error?.message || 'Gemini request failed.')
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') || ''
  }

  return ''
}

function deterministicSolutionMarkdown(payload, user) {
  const title = payload.title || titleFromSlug(payload.titleSlug)
  const language = payload.language || 'text'
  return `# ${title}

## Problem
- Platform: LeetCode
- Difficulty: ${payload.difficulty || 'Unknown'}
- Author: ${user?.name || 'CodeShelf User'}
- URL: ${payload.titleSlug ? `https://leetcode.com/problems/${payload.titleSlug}/` : 'Add the LeetCode problem URL'}

## Intuition
${payload.approach || 'Write the key observation that makes the solution work.'}

## Approach
- Identify the required state or invariant.
- Process the input while preserving that invariant.
- Return the final answer after all updates are complete.

## Complexity
${payload.complexity || '- Time: O(n)\n- Space: O(1) or O(n), depending on the data structure used.'}

## Code
\`\`\`${language.toLowerCase()}
${payload.code || '// Paste your accepted solution here.'}
\`\`\`

## Edge Cases
- Empty or minimum-size input.
- Duplicate values or repeated states.
- Large inputs near constraint limits.

## Revision Trigger
Explain the invariant first, then the update rule, then the reason it cannot miss a valid answer.
`
}

function cleanMarkdownResponse(value = '') {
  const trimmed = String(value || '').trim()
  if (!trimmed.startsWith('```')) return trimmed
  return trimmed.replace(/^```(?:markdown|md)?\s*/i, '').replace(/```$/, '').trim()
}

function titleFromSlug(slug = '') {
  return String(slug || 'LeetCode Solution')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function exportLeetCodeMarkdown({ markdown, title, titleSlug, user, source = 'manual' }) {
  const fileSlug = slugify(titleSlug || title)
  const fileName = `${fileSlug}.md`
  if (!existsSync(LEETCODE_EXPORT_DIR)) mkdirSync(LEETCODE_EXPORT_DIR, { recursive: true })
  const localPath = join(LEETCODE_EXPORT_DIR, fileName)
  writeFileSync(localPath, markdown)

  const exportResult = {
    localPath,
    repoPath: '',
    pushed: false,
    commit: '',
    message: 'Saved to CodeShelf data folder.',
  }

  const repoRoot = process.env.LEETCODE_REPO_PATH
  if (!repoRoot) return exportResult

  const repoDir = join(repoRoot, 'data', 'leetcode')
  if (!existsSync(repoDir)) mkdirSync(repoDir, { recursive: true })
  const repoPath = join(repoDir, fileName)
  writeFileSync(repoPath, markdown)
  exportResult.repoPath = repoPath
  exportResult.message = 'Saved to the configured repository data folder.'

  if (process.env.LEETCODE_AUTO_PUSH === 'true') {
    const relativePath = `data/leetcode/${fileName}`
    spawnSync('git', ['add', relativePath], { cwd: repoRoot })
    const commit = spawnSync('git', ['commit', '-m', `Add LeetCode solution: ${title}`], { cwd: repoRoot, encoding: 'utf8' })
    if (commit.status === 0) {
      const push = spawnSync('git', ['push'], { cwd: repoRoot, encoding: 'utf8' })
      exportResult.pushed = push.status === 0
      exportResult.commit = commit.stdout || commit.stderr || ''
      exportResult.message = exportResult.pushed ? 'Saved, committed, and pushed to the configured repository.' : 'Saved and committed. Git push needs attention.'
    } else if ((commit.stdout || commit.stderr || '').includes('nothing to commit')) {
      exportResult.message = 'Repository already had the latest Markdown file.'
    }
  }

  return exportResult
}

function makeLeetCodeNote({ payload, markdown, user, exportResult }) {
  const title = payload.title || titleFromSlug(payload.titleSlug)
  return makeNote({
    id: randomUUID(),
    authorId: user.id,
    title,
    description: payload.description || `${payload.difficulty || 'LeetCode'} solution with approach, complexity, code, and revision notes.`,
    content: markdown,
    topic: 'DSA',
    type: 'Code Explanation',
    tags: ['LeetCode', payload.difficulty || 'DSA', payload.language || 'Code'].filter(Boolean),
    repo: payload.repo || exportResult.repoPath || exportResult.localPath,
    visibility: payload.visibility || 'public',
    stats: { views: 0, likes: 0 },
  })
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

    if (path === '/api/leetcode/profile' && req.method === 'GET') {
      const username = url.searchParams.get('username') || user?.leetcodeUsername || ''
      const profile = await fetchLeetCodeProfile(username)
      return send(res, 200, { profile })
    }

    if (path === '/api/leetcode/connect' && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Login required.' })
      const body = await parseBody(req)
      const profile = await fetchLeetCodeProfile(body.username)
      user.leetcodeUsername = profile.username
      user.leetcodeProfile = {
        totalSolved: profile.totalSolved,
        ranking: profile.ranking,
        connectedAt: new Date().toISOString(),
      }
      db.activity.push({ id: randomUUID(), userId: user.id, type: 'leetcode', text: `Connected LeetCode profile @${profile.username}`, createdAt: new Date().toISOString() })
      writeDb(db)
      return send(res, 200, { user: publicUser(user), profile })
    }

    if (path === '/api/leetcode/sync' && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Login required.' })
      const body = await parseBody(req)
      const profile = await fetchLeetCodeProfile(body.username || user.leetcodeUsername)
      const limit = Math.max(1, Math.min(Number(body.limit || 5), 20))
      const recent = profile.recentAccepted
        .filter((item) => !body.todayOnly || sameLocalDate(new Date(item.solvedAt).getTime() / 1000))
        .slice(0, limit)
      const synced = []
      const skipped = []

      for (const problem of recent) {
        const alreadySynced = db.leetcodeSyncs.some((item) => item.userId === user.id && item.titleSlug === problem.titleSlug)
        if (alreadySynced) {
          skipped.push(problem)
          continue
        }

        const payload = {
          title: problem.title,
          titleSlug: problem.titleSlug,
          difficulty: 'LeetCode',
          language: 'Markdown',
          approach: `Accepted on LeetCode by @${profile.username} on ${new Date(problem.solvedAt).toLocaleString()}. Add your final code with the solution publisher when you want a complete community post.`,
          code: '',
          visibility: body.visibility || 'private',
          repo: body.repo || '',
        }
        const markdown = deterministicSolutionMarkdown(payload, user)
        const exportResult = exportLeetCodeMarkdown({ markdown, title: problem.title, titleSlug: problem.titleSlug, user, source: 'sync' })
        const note = makeLeetCodeNote({ payload, markdown, user, exportResult })
        db.notes.push(note)
        db.leetcodeSyncs.push({
          id: randomUUID(),
          userId: user.id,
          username: profile.username,
          title: problem.title,
          titleSlug: problem.titleSlug,
          noteId: note.id,
          solvedAt: problem.solvedAt,
          exportResult,
          createdAt: new Date().toISOString(),
        })
        synced.push({ problem, note: displayNote(note, db), exportResult })
      }

      if (synced.length) {
        db.activity.push({ id: randomUUID(), userId: user.id, type: 'leetcode', text: `Synced ${synced.length} LeetCode solution${synced.length === 1 ? '' : 's'} into CodeShelf`, createdAt: new Date().toISOString() })
      }
      writeDb(db)
      return send(res, 200, { profile, synced, skipped })
    }

    if (path === '/api/leetcode/solution' && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Login required.' })
      const body = await parseBody(req)
      if (!body.title && !body.titleSlug) return send(res, 400, { error: 'Question title or slug is required.' })
      if (!body.code) return send(res, 400, { error: 'Paste your accepted solution code first.' })
      const markdown = await buildSolutionMarkdown(body, user)
      const exportResult = exportLeetCodeMarkdown({ markdown, title: body.title || titleFromSlug(body.titleSlug), titleSlug: body.titleSlug, user, source: 'manual' })
      const note = makeLeetCodeNote({ payload: body, markdown, user, exportResult })
      db.notes.push(note)
      db.activity.push({ id: randomUUID(), userId: user.id, type: 'leetcode', text: `Published LeetCode solution: ${note.title}`, createdAt: new Date().toISOString() })
      writeDb(db)
      return send(res, 201, { note: displayNote(note, db), markdown, exportResult })
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
