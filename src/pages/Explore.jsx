import { Code, Database, Eye, FileText, Filter, Heart, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { topNotes } from '../data/mockData.js'

const iconMap = { Code, Database, FileText }
const filters = ['All', 'DSA', 'SQL', 'Algorithms', 'System Design', 'Concepts']

export default function Explore() {
  return (
    <div className="page">
      <PageHeader title="Explore Notes" subtitle="Discover quality notes shared by the community" />
      <div className="toolbar">
        <label className="search-field"><Search size={16} /><input placeholder="Search notes by title or topic..." /></label>
        <button className="btn btn-secondary"><Filter size={16} /> Filters</button>
      </div>
      <Tabs items={filters} />
      <NoteGrid notes={[...topNotes, ...topNotes]} />
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

export function Tabs({ items }) {
  return (
    <div className="tabs">
      {items.map((item, index) => <button className={index === 0 ? 'active' : ''} key={item}>{item}</button>)}
    </div>
  )
}

export function NoteGrid({ notes }) {
  return (
    <div className="explore-grid">
      {notes.map((note, index) => {
        const Icon = iconMap[note.icon]
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
