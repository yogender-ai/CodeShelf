import { CheckCircle2, Code2, ExternalLink, GitBranch, Loader2, Send, Trophy, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { leetcodeApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Field, PageTitle } from './Upload.jsx'

const defaultSolution = {
  title: '',
  titleSlug: '',
  difficulty: 'Medium',
  language: 'cpp',
  approach: '',
  complexity: '',
  code: '',
  visibility: 'public',
  repo: '',
}

export default function LeetCode() {
  const { user } = useAuth()
  const [username, setUsername] = useState(user?.leetcodeUsername || '')
  const [profile, setProfile] = useState(null)
  const [solution, setSolution] = useState(defaultSolution)
  const [loading, setLoading] = useState('')
  const [status, setStatus] = useState('')
  const [createdNote, setCreatedNote] = useState(null)
  const [syncResult, setSyncResult] = useState(null)

  async function connectProfile(event) {
    event.preventDefault()
    if (!username.trim()) return
    setLoading('profile')
    setStatus('')
    try {
      const data = user ? await leetcodeApi.connect({ username }) : await leetcodeApi.profile(username)
      setProfile(data.profile)
      setUsername(data.profile.username)
      setStatus(`Connected @${data.profile.username}.`)
    } catch (err) {
      setStatus(err.message)
    } finally {
      setLoading('')
    }
  }

  async function syncRecent(todayOnly = false) {
    setLoading(todayOnly ? 'today' : 'sync')
    setStatus('')
    try {
      const data = await leetcodeApi.sync({ username, todayOnly, limit: todayOnly ? 10 : 5, visibility: 'private' })
      setProfile(data.profile)
      setSyncResult(data)
      setStatus(`${data.synced.length} synced, ${data.skipped.length} already in your shelf.`)
    } catch (err) {
      setStatus(err.message)
    } finally {
      setLoading('')
    }
  }

  async function publishSolution(event) {
    event.preventDefault()
    setLoading('solution')
    setStatus('')
    setCreatedNote(null)
    try {
      const data = await leetcodeApi.publishSolution(solution)
      setCreatedNote(data.note)
      setStatus(data.exportResult.message)
      setSolution(defaultSolution)
    } catch (err) {
      setStatus(err.message)
    } finally {
      setLoading('')
    }
  }

  function updateSolution(key, value) {
    setSolution((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="page leetcode-page">
      <div className="split-header">
        <PageTitle title="LeetCode Sync" subtitle="Track your profile, sync accepted problems, and publish clean solution notes" />
        <a className="btn btn-secondary" href="https://leetcode.com" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open LeetCode</a>
      </div>

      <section className="leetcode-connect card">
        <form onSubmit={connectProfile}>
          <Field label="LeetCode Username">
            <div className="inline-control">
              <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username or demo" />
              <button className="btn btn-primary" disabled={loading === 'profile'}>
                {loading === 'profile' ? <Loader2 className="spin" size={16} /> : <Trophy size={16} />}
                Connect
              </button>
            </div>
          </Field>
        </form>
        <div>
          <strong>Auto repo export</strong>
          <p className="muted">Every sync writes Markdown into `backend/data/leetcode`. Set `LEETCODE_REPO_PATH` and `LEETCODE_AUTO_PUSH=true` on the API server to commit and push into your own repo.</p>
        </div>
      </section>

      {status ? <p className="recall-answer">{status}</p> : null}

      {profile ? <ProfilePanel profile={profile} onSync={syncRecent} loading={loading} /> : null}

      {syncResult?.synced?.length ? (
        <section className="card leetcode-synced">
          <h3><CheckCircle2 size={17} /> Latest synced files</h3>
          <div className="list-stack">
            {syncResult.synced.map((item) => (
              <article className="leetcode-sync-row" key={item.problem.titleSlug}>
                <span><Code2 size={16} /> {item.problem.title}</span>
                <Link to={`/note/${item.note.id}`} className="btn btn-secondary">View Note</Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="leetcode-workbench">
        <form className="card form-card" onSubmit={publishSolution}>
          <h2>Publish Accepted Solution</h2>
          <div className="two-col">
            <Field label="Question Title *"><input className="input" value={solution.title} onChange={(event) => updateSolution('title', event.target.value)} placeholder="Two Sum" /></Field>
            <Field label="Question Slug"><input className="input" value={solution.titleSlug} onChange={(event) => updateSolution('titleSlug', event.target.value)} placeholder="two-sum" /></Field>
          </div>
          <div className="three-col">
            <Field label="Difficulty"><select className="input" value={solution.difficulty} onChange={(event) => updateSolution('difficulty', event.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></Field>
            <Field label="Language"><input className="input" value={solution.language} onChange={(event) => updateSolution('language', event.target.value)} placeholder="cpp, java, python" /></Field>
            <Field label="Visibility"><select className="input" value={solution.visibility} onChange={(event) => updateSolution('visibility', event.target.value)}><option value="public">Public</option><option value="private">Private</option><option value="group">Group</option></select></Field>
          </div>
          <Field label="Approach Notes"><textarea className="input" value={solution.approach} onChange={(event) => updateSolution('approach', event.target.value)} rows="3" placeholder="Hash map stores the index needed to complete the target..." /></Field>
          <Field label="Complexity"><input className="input" value={solution.complexity} onChange={(event) => updateSolution('complexity', event.target.value)} placeholder="Time: O(n), Space: O(n)" /></Field>
          <Field label="Accepted Code *"><textarea className="input mono" value={solution.code} onChange={(event) => updateSolution('code', event.target.value)} rows="14" placeholder="Paste your accepted LeetCode solution..." /></Field>
          <Field label="Repository Link or Path"><input className="input" value={solution.repo} onChange={(event) => updateSolution('repo', event.target.value)} placeholder="optional GitHub URL or local export path" /></Field>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={loading === 'solution'}>{loading === 'solution' ? <Loader2 className="spin" size={16} /> : <UploadCloud size={16} />} Publish to Community</button>
          </div>
        </form>

        <aside className="side-stack">
          <section className="card">
            <h3><GitBranch size={16} /> What Gets Created</h3>
            <ul className="check-list">
              <li>A CodeShelf community note</li>
              <li>A Markdown file in `data/leetcode`</li>
              <li>AI-polished structure when API keys exist</li>
              <li>Optional git commit and push from the API server</li>
            </ul>
          </section>
          {createdNote ? (
            <section className="card">
              <h3><Send size={16} /> Published</h3>
              <p className="muted">{createdNote.title}</p>
              <Link className="btn btn-secondary full" to={`/note/${createdNote.id}`}>Open Note</Link>
            </section>
          ) : null}
        </aside>
      </section>
    </div>
  )
}

function ProfilePanel({ profile, onSync, loading }) {
  return (
    <section className="leetcode-profile">
      <article className="card leetcode-identity">
        <div className="avatar xl">{profile.username.charAt(0).toUpperCase()}</div>
        <div>
          <h2>{profile.realName || profile.username}</h2>
          <p className="accent-text">@{profile.username}</p>
          <p className="muted">{profile.about || 'LeetCode profile connected to CodeShelf.'}</p>
        </div>
      </article>
      <div className="leetcode-metrics">
        <Metric label="Solved" value={`${profile.totalSolved}/${profile.totalQuestions}`} />
        <Metric label="Solved Today" value={profile.todaySolved} />
        <Metric label="Unsolved" value={profile.unsolved} />
        <Metric label="Streak" value={profile.streak} />
        <Metric label="Ranking" value={profile.ranking || 'NA'} />
        <Metric label="Acceptance" value={`${profile.acceptanceRate}%`} />
      </div>
      <article className="card leetcode-difficulty">
        {profile.difficulty.map((item) => (
          <div key={item.difficulty}>
            <span>{item.difficulty}</span>
            <strong>{item.solved}/{item.total}</strong>
            <progress max={item.total || 1} value={item.solved} />
          </div>
        ))}
      </article>
      <article className="card leetcode-recent">
        <header>
          <h3>Recent Accepted</h3>
          <div className="row-actions">
            <button className="btn btn-secondary" onClick={() => onSync(true)} disabled={loading === 'today'}>{loading === 'today' ? <Loader2 className="spin" size={15} /> : <CheckCircle2 size={15} />} Today</button>
            <button className="btn btn-primary" onClick={() => onSync(false)} disabled={loading === 'sync'}>{loading === 'sync' ? <Loader2 className="spin" size={15} /> : <GitBranch size={15} />} Sync Latest</button>
          </div>
        </header>
        <div className="list-stack">
          {profile.recentAccepted.map((item) => (
            <a href={`https://leetcode.com/problems/${item.titleSlug}/`} target="_blank" rel="noreferrer" className="leetcode-recent-row" key={item.id}>
              <span>{item.title}</span>
              <small>{new Date(item.solvedAt).toLocaleDateString()}</small>
            </a>
          ))}
        </div>
      </article>
    </section>
  )
}

function Metric({ label, value }) {
  return <div className="card metric"><strong>{value}</strong><span>{label}</span></div>
}
