import { ArrowLeft, Bookmark, Calendar, Eye, GitBranch, Heart, Search, Share2, Sparkles, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { assistApi, notesApi } from '../api/client.js'
import { topNotes } from '../data/mockData.js'

export default function NoteDetail() {
  const { id } = useParams()
  const [note, setNote] = useState(null)
  const [summary, setSummary] = useState('')
  const [concept, setConcept] = useState('')
  const [conceptAnswer, setConceptAnswer] = useState('')
  const [shareEmail, setShareEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    notesApi.get(id).then((data) => {
      setNote(data.note)
      setSummary(data.note.summary)
    }).catch(() => setNote(topNotes.find((item) => item.id === Number(id)) || topNotes[0]))
  }, [id])

  async function refreshSummary() {
    const data = await assistApi.summarize({ noteId: note.id, count: 3 })
    setSummary(data.summary)
  }

  async function recallConcept(event) {
    event.preventDefault()
    const data = await assistApi.concept({ query: concept })
    setConceptAnswer(data.answer)
  }

  async function likeNote() {
    const data = await notesApi.like(note.id)
    setNote(data.note)
  }

  async function shareNote(event) {
    event.preventDefault()
    try {
      await notesApi.share(note.id, { email: shareEmail, message })
      setMessage('Shared successfully.')
      setShareEmail('')
    } catch (err) {
      setMessage(err.message)
    }
  }

  if (!note) return <div className="page"><p className="muted">Loading note...</p></div>

  return (
    <div className="page detail-page">
      <Link to="/explore" className="back-link"><ArrowLeft size={16} /> Back to Explore</Link>
      <div className="detail-grid">
        <main>
          <section className="detail-header">
            <div className="tags">{note.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
            <h1>{note.title}</h1>
            <p>{note.description}</p>
            <div className="detail-meta">
              <div className="mini-author"><span className="avatar sm">{note.author.charAt(0)}</span><span><strong>{note.author}</strong><small><Calendar size={11} /> {note.timeAgo}</small></span></div>
              <div><span><Eye size={14} /> {note.views} views</span><span><Heart size={14} /> {note.likes} likes</span></div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={likeNote}><Heart size={16} /> Like</button>
              <button className="btn btn-secondary"><Bookmark size={16} /> Save</button>
              <button className="btn btn-secondary"><Share2 size={16} /> Share</button>
            </div>
          </section>

          <article className="markdown card">
            {note.images?.length ? <div className="note-images">{note.images.map((image) => <img key={image.name} src={image.dataUrl} alt={image.name} />)}</div> : null}
            <MarkdownLite content={note.content} />
          </article>
        </main>

        <aside className="detail-rail">
          <section className="card">
            <h3><Sparkles size={16} /> Walking Revision</h3>
            <p className="muted">{summary}</p>
            <button className="btn btn-secondary full" onClick={refreshSummary}>Regenerate Summary</button>
          </section>
          <section className="card">
            <h3><Search size={16} /> Instant Concept Recall</h3>
            <form className="mini-form" onSubmit={recallConcept}>
              <input className="input" value={concept} onChange={(event) => setConcept(event.target.value)} placeholder="Ask: SQL left join, DP state..." />
              <button className="btn btn-primary full">Recall</button>
            </form>
            {conceptAnswer ? <p className="recall-answer">{conceptAnswer}</p> : null}
          </section>
          <section className="card">
            <h3><GitBranch size={16} /> Connected Repository</h3>
            <p className="repo-name">{note.repo}</p>
            <p className="muted"><Star size={12} /> {note.stars} stars - Updated {note.repoUpdated}</p>
            <button className="btn btn-secondary full"><GitBranch size={14} /> View on GitHub</button>
          </section>
          <section className="card">
            <h3><Share2 size={16} /> Share With Friend</h3>
            <form className="mini-form" onSubmit={shareNote}>
              <input className="input" type="email" value={shareEmail} onChange={(event) => setShareEmail(event.target.value)} placeholder="friend@example.com" />
              <button className="btn btn-secondary full">Send Note</button>
            </form>
            {message ? <p className="muted">{message}</p> : null}
          </section>
        </aside>
      </div>
    </div>
  )
}

function MarkdownLite({ content }) {
  const parts = String(content || '').split(/(```[\s\S]*?```)/g)
  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      return <pre key={index}><code>{part.replace(/^```\w*\n?/, '').replace(/```$/, '')}</code></pre>
    }
    return part.split('\n').map((line, lineIndex) => {
      if (!line.trim()) return null
      if (line.startsWith('# ')) return <h2 key={`${index}-${lineIndex}`}>{line.replace('# ', '')}</h2>
      if (line.startsWith('## ')) return <h3 key={`${index}-${lineIndex}`}>{line.replace('## ', '')}</h3>
      if (line.startsWith('- ')) return <p className="bullet-line" key={`${index}-${lineIndex}`}>{line.replace('- ', '')}</p>
      return <p key={`${index}-${lineIndex}`}>{line}</p>
    })
  })
}
