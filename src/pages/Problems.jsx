import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { problemsApi } from '../api/client.js'
import { Field, PageTitle } from './Upload.jsx'

const emptyProblem = { platform: 'LeetCode', title: '', url: '', difficulty: 'Medium', topic: 'DSA', pattern: '', status: 'not_started', approach: '', code: '', language: 'cpp', mistake: '', time_complexity: '', space_complexity: '', generate_cards: true }

export default function Problems() {
  const [problems, setProblems] = useState([])
  const [filters, setFilters] = useState({ topic: '', pattern: '', difficulty: '', status: '' })
  const [form, setForm] = useState(emptyProblem)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [filters])
  const load = () => problemsApi.list(filters).then((data) => setProblems(data.problems || [])).catch((err) => setError(err.message))
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    await problemsApi.create(form)
    setForm(emptyProblem)
    load()
  }

  return (
    <div className="page">
      <PageTitle title="Problem Tracker" subtitle="Track solved, weak, revisit, and due coding problems." />
      <div className="toolbar">
        <label className="search-field"><Search size={16} /><input value={filters.topic} onChange={(e) => setFilters({ ...filters, topic: e.target.value })} placeholder="Filter topic..." /></label>
        <select className="input compact" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All status</option><option>not_started</option><option>solved</option><option>revisit</option><option>weak</option></select>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="dashboard-grid">
        <section className="card form-card">
          <h2>Add Problem</h2>
          <form onSubmit={submit}>
            <Field label="Title"><input className="input" value={form.title} onChange={(e) => update('title', e.target.value)} /></Field>
            <div className="three-col"><Field label="Platform"><input className="input" value={form.platform} onChange={(e) => update('platform', e.target.value)} /></Field><Field label="Topic"><input className="input" value={form.topic} onChange={(e) => update('topic', e.target.value)} /></Field><Field label="Pattern"><input className="input" value={form.pattern} onChange={(e) => update('pattern', e.target.value)} /></Field></div>
            <Field label="Approach"><textarea className="input" rows="4" value={form.approach} onChange={(e) => update('approach', e.target.value)} /></Field>
            <Field label="Mistake"><textarea className="input" rows="3" value={form.mistake} onChange={(e) => update('mistake', e.target.value)} /></Field>
            <button className="btn btn-primary"><Plus size={16} /> Save Problem</button>
          </form>
        </section>
        <section className="card">
          <h2>Problems</h2>
          <div className="list-stack">
            {problems.map((problem) => <Link className="revision-row" to={`/problems/${problem.id}`} key={problem.id}><span>{problem.title}</span><small>{problem.topic} · {problem.pattern || 'No pattern'} · {problem.status}</small></Link>)}
            {!problems.length ? <p className="muted">No problems tracked yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
