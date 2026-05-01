import { Edit2, Eye, Heart, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { topNotes } from '../data/mockData.js'
import { PageTitle } from './Upload.jsx'

export default function MyContributions() {
  return (
    <div className="page">
      <div className="split-header"><PageTitle title="My Contributions" subtitle="Manage your uploaded notes and drafts" /><Link to="/upload" className="btn btn-primary"><Plus size={16} /> New Note</Link></div>
      <div className="stats-grid">{[{ l: 'Total Notes', v: 8, c: '#8b5cf6' }, { l: 'Total Views', v: '1.5k', c: '#3b82f6' }, { l: 'Total Likes', v: 342, c: '#ef4444' }, { l: 'Drafts', v: 2, c: '#f59e0b' }].map((s) => <div className="card metric" key={s.l}><strong style={{ color: s.c }}>{s.v}</strong><span>{s.l}</span></div>)}</div>
      <div className="tabs"><button className="active">Published</button><button>Drafts</button><button>Archived</button></div>
      <div className="list-stack">
        {topNotes.map((note) => (
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
