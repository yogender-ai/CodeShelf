import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { notesApi } from '../api/client.js'
import { Field, PageTitle } from './Upload.jsx'

export default function EditNote() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    notesApi.get(id).then((data) => setForm({ ...data.note, generate_cards: false })).catch((err) => setError(err.message))
  }, [id])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    try {
      const data = await notesApi.update(id, { ...form, tags: form.tags || [] })
      navigate(`/note/${data.note.id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!form) return <div className="page"><p className="muted">Loading note...</p>{error ? <p className="form-error">{error}</p> : null}</div>

  return (
    <div className="page">
      <PageTitle title="Edit Note" subtitle="Keep your coding memory accurate." />
      <form className="card form-card" onSubmit={submit}>
        <Field label="Title"><input className="input" value={form.title} onChange={(e) => update('title', e.target.value)} /></Field>
        <div className="three-col">
          <Field label="Type"><input className="input" value={form.note_type} onChange={(e) => update('note_type', e.target.value)} /></Field>
          <Field label="Topic"><input className="input" value={form.topic} onChange={(e) => update('topic', e.target.value)} /></Field>
          <Field label="Difficulty"><input className="input" value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)} /></Field>
        </div>
        <Field label="Content"><textarea className="input" rows="12" value={form.content} onChange={(e) => update('content', e.target.value)} /></Field>
        <Field label="Code"><textarea className="input mono" rows="6" value={form.code_snippet || ''} onChange={(e) => update('code_snippet', e.target.value)} /></Field>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn-primary">Save Changes</button>
      </form>
    </div>
  )
}
