import { Calendar, Edit, GitBranch, Link as LinkIcon, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { notesApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { currentUser, topNotes } from '../data/mockData.js'
import { NoteGrid, Tabs } from './Explore.jsx'

export default function Profile() {
  const { user } = useAuth()
  const activeUser = user || currentUser
  const [notes, setNotes] = useState(topNotes)

  useEffect(() => {
    notesApi.list({ mine: true }).then((data) => setNotes(data.notes)).catch(() => setNotes(topNotes))
  }, [])

  return (
    <div className="page">
      <div className="profile-banner" />
      <section className="card profile-header-card">
        <div className="avatar xl">{activeUser.name.charAt(0)}</div>
        <div className="profile-copy">
          <h1>{activeUser.name}</h1>
          <p className="accent-text">{activeUser.role}</p>
          <p>{activeUser.bio || 'Full-stack learner building a revision shelf for notes, code, and concepts.'}</p>
          <div className="profile-meta"><span><MapPin size={13} /> {activeUser.location || 'India'}</span><span><GitBranch size={13} /> {activeUser.github || 'github.com/yogender-ai'}</span><span><LinkIcon size={13} /> CodeShelf</span><span><Calendar size={13} /> Joined 2026</span></div>
        </div>
        <button className="btn btn-secondary"><Edit size={14} /> Edit Profile</button>
      </section>
      <div className="stats-grid">{[{ l: 'Contributions', v: notes.length, c: '#8b5cf6' }, { l: 'Total Views', v: notes.reduce((sum, note) => sum + (Number(String(note.views).replace('k', '000')) || 0), 0), c: '#3b82f6' }, { l: 'Likes Received', v: notes.reduce((sum, note) => sum + (Number(note.likes) || 0), 0), c: '#ef4444' }, { l: 'Repositories', v: notes.filter((note) => note.repo).length, c: '#10b981' }].map((s) => <div className="card metric" key={s.l}><strong style={{ color: s.c }}>{s.v}</strong><span>{s.l}</span></div>)}</div>
      <Tabs items={['Notes', 'Repositories', 'Activity', 'About']} />
      <h2 className="section-title-standalone">Published Notes</h2>
      <NoteGrid notes={notes} />
    </div>
  )
}
