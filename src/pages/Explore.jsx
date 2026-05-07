import { Code, Database, Eye, FileText, Filter, GitBranch, Heart, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { notesApi } from '../api/client.js'
import { topNotes } from '../data/mockData.js'

const iconMap = { Code, Database, FileText, Sparkles: Code, GitBranch: Code, Lightbulb: FileText }
const filters = ['All', 'DSA', 'SQL', 'ML', 'NLP', 'Projects', 'Concepts']

export default function Explore() {
  const [params] = useSearchParams()
  const [notes, setNotes] = useState([])
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState(params.get('topic') || '')
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      notesApi.list({ search, topic }).then((data) => {
        setNotes(data.notes)
        setError('')
      }).catch((err) => setError(err.message))
    }, 180)
    return () => clearTimeout(timer)
  }, [search, topic])

  return (
    <div className="page">
      <PageHeader title="Explore Notes" subtitle="Search DSA, SQL, ML, NLP, project notes, code, images, and explanations" />
      <div className="toolbar">
        <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes by title, topic, code, or concept..." /></label>
        <button className="btn btn-secondary"><Filter size={16} /> Filters</button>
      </div>
      <Tabs items={filters} active={topic || 'All'} onChange={(item) => setTopic(item === 'All' ? '' : item)} />
      {error ? <p className="form-error">{error}</p> : null}
      <NoteGrid notes={notes.length ? notes : topNotes} />
    </div>
  )
}

export function PageHeader({ title, subtitle }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  )
}

export function Tabs({ items, active = 'All', onChange }) {
  return (
    <div className="tabs">
      {items.map((item) => <button type="button" onClick={() => onChange?.(item)} className={item.toLowerCase() === active.toLowerCase() ? 'active' : ''} key={item}>{item}</button>)}
    </div>
  )
}

export function NoteGrid({ notes }) {
  return (
    <div className="explore-grid">
      {notes.map((note, index) => {
        const Icon = iconMap[note.icon] || FileText
        return (
          <Link to={`/note/${note.id}`} className="explore-card card" key={`${note.id}-${index}`}>
            <div className="explore-cover" style={{ '--note-color': note.color }}><Icon size={36} /></div>
            <div className="explore-card-body">
              <h3>{note.title}</h3>
              <p>{note.description}</p>
              <div className="tags">{note.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
              <footer>
                <span className="mini-author"><span className="avatar xs">{note.author.charAt(0)}</span>{note.author}</span>
                <span><Eye size={12} /> {note.views}</span>
                <span><Heart size={12} /> {note.likes}</span>
              </footer>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
