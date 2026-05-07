import { Edit2, Eye, Heart, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { notesApi } from '../api/client.js'
import { topNotes } from '../data/mockData.js'
import { PageTitle } from './Upload.jsx'

export default function MyContributions() {
  const [notes, setNotes] = useState(topNotes)

  useEffect(() => {
    notesApi.list({ mine: true }).then((data) => setNotes(data.notes)).catch(() => setNotes(topNotes))
  }, [])

  const totals = notes.reduce((acc, note) => {
    acc.likes += Number(note.likes) || 0
    acc.views += Number(String(note.views).replace('k', '000')) || 0
    return acc
  }, { likes: 0, views: 0 })

  return (
    <div className="page">
      <div className="split-header"><PageTitle title="My Contributions" subtitle="Manage your uploaded notes and drafts" /><Link to="/upload" className="btn btn-primary"><Plus size={16} /> New Note</Link></div>
      <div className="stats-grid">{[{ l: 'Total Notes', v: notes.length, c: '#8b5cf6' }, { l: 'Total Views', v: totals.views, c: '#3b82f6' }, { l: 'Total Likes', v: totals.likes, c: '#ef4444' }, { l: 'Drafts', v: 0, c: '#f59e0b' }].map((s) => <div className="card metric" key={s.l}><strong style={{ color: s.c }}>{s.v}</strong><span>{s.l}</span></div>)}</div>
      <div className="tabs"><button className="active">Published</button><button>Drafts</button><button>Archived</button></div>
      <div className="list-stack">
        {notes.map((note) => (
          <article className="card contribution-row" key={note.id}>
            <div className="row-icon" style={{ '--note-color': note.color }}>{note.title.charAt(0)}</div>
            <div><h3>{note.title}</h3><p><Eye size={12} /> {note.views} <Heart size={12} /> {note.likes} {note.timeAgo}</p></div>
            <div className="row-actions"><button className="icon-button"><Edit2 size={15} /></button><button className="icon-button danger"><Trash2 size={15} /></button></div>
          </article>
        ))}
      </div>
    </div>
  )
}
