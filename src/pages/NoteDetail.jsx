import { ArrowLeft, Brain, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { aiApi, notesApi } from '../api/client.js'

export default function NoteDetail() {
  const { id } = useParams()
  const [note, setNote] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    notesApi.get(id).then((data) => setNote(data.note)).catch((err) => setError(err.message))
  }, [id])

  async function generateCards() {
    setStatus('Generating recall cards...')
    const data = await notesApi.generateCards(note.id)
    setStatus(`${data.cards.length} cards generated.`)
    const refreshed = await notesApi.get(note.id)
    setNote(refreshed.note)
  }

  async function explainWalk() {
    const data = await aiApi.explainForWalkMode({ text: note.content, title: note.title, topic: note.topic })
    setStatus(data.explanation)
  }

  if (error) return <div className="page"><p className="form-error">{error}</p></div>
  if (!note) return <div className="page"><p className="muted">Loading note...</p></div>

  return (
    <div className="page detail-page">
      <Link to="/library" className="back-link"><ArrowLeft size={16} /> Back to Library</Link>
      <div className="detail-grid">
        <main>
          <section className="detail-header">
            <div className="tags">{[note.topic, note.note_type, note.difficulty, ...(note.tags || [])].map((tag) => <small key={tag}>{tag}</small>)}</div>
            <h1>{note.title}</h1>
            <p>{note.summary || 'No summary yet.'}</p>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={generateCards}><Brain size={16} /> Generate Cards</button>
              <button className="btn btn-secondary" onClick={explainWalk}><Sparkles size={16} /> Explain for Walk Mode</button>
              <Link to={`/edit/${note.id}`} className="btn btn-secondary">Edit</Link>
            </div>
          </section>
          <article className="markdown card"><MarkdownLite content={note.content} /></article>
          {note.code_snippet ? <pre className="code-panel">{note.code_snippet}</pre> : null}
        </main>
        <aside className="detail-rail">
          <section className="card">
            <h3>Related Cards</h3>
            <div className="list-stack">
              {(note.revision_cards || []).map((card) => <article className="revision-row" key={card.id}><span>{card.question}</span><small>Due {card.next_review_date}</small></article>)}
              {!note.revision_cards?.length ? <p className="muted">No cards yet.</p> : null}
            </div>
          </section>
          {status ? <section className="card"><h3>Assistant</h3><p className="muted">{status}</p></section> : null}
        </aside>
      </div>
    </div>
  )
}

function MarkdownLite({ content }) {
  return String(content || '').split('\n').map((line, index) => {
    if (!line.trim()) return null
    if (line.startsWith('# ')) return <h2 key={index}>{line.slice(2)}</h2>
    if (line.startsWith('## ')) return <h3 key={index}>{line.slice(3)}</h3>
    if (line.startsWith('- ')) return <p className="bullet-line" key={index}>{line.slice(2)}</p>
    return <p key={index}>{line}</p>
  })
}
