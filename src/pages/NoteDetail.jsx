import { ArrowLeft, Bookmark, Calendar, Eye, GitBranch, Heart, Search, Share2, Sparkles, Star, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'
import { cpp } from '@codemirror/lang-cpp'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { assistApi, notesApi } from '../api/client.js'
import { topNotes, currentUser } from '../data/mockData.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function NoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const activeUser = user || currentUser
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
              {note.authorId === activeUser.id && (
                <>
                  <Link to={`/edit/${note.id}`} className="btn btn-secondary">Edit</Link>
                  <button className="btn btn-secondary" onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this note?')) {
                      await notesApi.remove(note.id)
                      navigate('/explore')
                    }
                  }} style={{ color: 'var(--red)' }}>Delete</button>
                </>
              )}
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
      const codePart = part.replace(/^```(\w*)\n?/, '').replace(/\n?```$/, '')
      const lang = part.match(/^```(\w*)/)?.[1] || ''
      return <CodeBlock key={index} code={codePart} lang={lang} />
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

function CodeBlock({ code, lang }) {
  const [output, setOutput] = useState('')
  
  const getExt = () => {
    if (lang === 'js' || lang === 'javascript') return [javascript()]
    if (lang === 'py' || lang === 'python') return [python()]
    if (lang === 'sql') return [sql()]
    if (lang === 'cpp' || lang === 'c++' || lang === 'c') return [cpp()]
    return []
  }

  const runCode = () => {
    if (lang !== 'javascript' && lang !== 'js') return
    let logs = []
    const originalLog = console.log
    console.log = (...args) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
    }
    
    try {
      const fn = new Function(code)
      const result = fn()
      if (result !== undefined) logs.push(String(result))
      setOutput(logs.join('\n') || 'Code executed successfully with no output.')
    } catch (e) {
      setOutput('Error: ' + e.message)
    } finally {
      console.log = originalLog
    }
  }

  return (
    <div style={{ margin: '16px 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#1e1e1e', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>{lang || 'code'}</span>
        {(lang === 'javascript' || lang === 'js') && (
          <button onClick={runCode} style={{ background: 'transparent', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', border: 'none' }}>
            <Play size={14} /> Run Code
          </button>
        )}
      </div>
      <CodeMirror
        value={code}
        readOnly={true}
        theme={vscodeDark}
        extensions={getExt()}
        style={{ fontSize: '14px' }}
      />
      {output && (
        <div style={{ background: '#000', color: '#10b981', padding: '12px', fontFamily: 'monospace', fontSize: '13px', borderTop: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
          {output}
        </div>
      )}
    </div>
  )
}
