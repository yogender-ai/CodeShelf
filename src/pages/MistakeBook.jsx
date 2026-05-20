import { AlertTriangle, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { mistakesApi } from '../api/client.js'
import { Field, PageTitle } from './Upload.jsx'

const empty = { mistake_title: '', wrong_approach: '', correct_approach: '', reason: '', prevention_tip: '', topic: 'DSA', generate_card: true }

export default function MistakeBook() {
  const [mistakes, setMistakes] = useState([])
  const [form, setForm] = useState(empty)
  const [topic, setTopic] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { load() }, [topic])
  const load = () => mistakesApi.list({ topic }).then((data) => setMistakes(data.mistakes || [])).catch((err) => setError(err.message))
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  async function submit(event) {
    event.preventDefault()
    await mistakesApi.create(form)
    setForm(empty)
    load()
  }
  return (
    <div className="page">
      <PageTitle title="Mistake Book" subtitle="Interview danger zone: revise only what has hurt you before." />
      <div className="toolbar"><input className="input compact" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Filter topic" /></div>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="dashboard-grid">
        <section className="card form-card">
          <h2>Add Mistake</h2>
          <form onSubmit={submit}>
            <Field label="Mistake Title"><input className="input" value={form.mistake_title} onChange={(e) => update('mistake_title', e.target.value)} /></Field>
            <Field label="Wrong Approach"><textarea className="input" rows="3" value={form.wrong_approach} onChange={(e) => update('wrong_approach', e.target.value)} /></Field>
            <Field label="Correct Approach"><textarea className="input" rows="3" value={form.correct_approach} onChange={(e) => update('correct_approach', e.target.value)} /></Field>
            <Field label="Prevention Tip"><input className="input" value={form.prevention_tip} onChange={(e) => update('prevention_tip', e.target.value)} /></Field>
            <button className="btn btn-primary"><Plus size={16} /> Save Mistake</button>
          </form>
        </section>
        <section className="card">
          <h2><AlertTriangle size={18} /> Mistakes</h2>
          <div className="list-stack">{mistakes.map((m) => <article className="revision-row" key={m.id}><span>{m.mistake_title}</span><small>{m.topic} · repeated {m.times_repeated}x</small><p className="muted">{m.prevention_tip}</p></article>)}</div>
          {!mistakes.length ? <p className="muted">No mistakes logged yet.</p> : null}
        </section>
      </div>
    </div>
  )
}
