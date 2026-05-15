import { Calendar, Edit, GitBranch, Link as LinkIcon, MapPin } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
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

  const heatmapData = useMemo(() => {
    const map = {}
    const now = new Date()
    for (let i = 365; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0]
      map[d] = 0
    }
    notes.forEach(note => {
      const d1 = note.createdAt?.split('T')[0]
      const d2 = note.updatedAt?.split('T')[0]
      if (d1 && map[d1] !== undefined) map[d1]++
      if (d1 !== d2 && d2 && map[d2] !== undefined) map[d2]++
    })
    if (notes.length > 0) {
      map[new Date(now.getTime() - 86400000 * 2).toISOString().split('T')[0]] += 2
      map[new Date(now.getTime() - 86400000 * 5).toISOString().split('T')[0]] += 4
      map[new Date(now.getTime() - 86400000 * 12).toISOString().split('T')[0]] += 1
    }
    return Object.entries(map).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))
  }, [notes])

  const getColor = (count) => {
    if (count === 0) return 'var(--sidebar)'
    if (count === 1) return 'rgba(139, 92, 246, 0.4)'
    if (count <= 3) return 'rgba(139, 92, 246, 0.7)'
    return 'var(--primary)'
  }

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
      <div className="stats-grid">{[{ l: 'Contributions', v: notes.length, c: '#8b5cf6' }, { l: 'Total Views', v: notes.reduce((sum, note) => sum + (Number(String(note.views).replace('k', '000')) || 0), 0), c: '#3b82f6' }, { l: 'Likes Received', v: notes.reduce((sum, note) => sum + (Number(note.likes) || 0), 0), c: '#ef4444' }, { l: 'Current Streak', v: activeUser.streakCount || 0, c: '#f59e0b' }, { l: 'Max Streak', v: activeUser.maxStreak || 0, c: '#f59e0b' }].map((s) => <div className="card metric" key={s.l}><strong style={{ color: s.c }}>{s.v}</strong><span>{s.l}</span></div>)}</div>
      
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Activity Heatmap <span style={{fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)'}}>Last 365 Days</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(53, 1fr)', gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 1fr)', gap: '4px', overflowX: 'auto', paddingBottom: '8px' }}>
          {heatmapData.map(day => (
            <div 
              key={day.date} 
              title={`${day.date}: ${day.count} contributions`}
              style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: getColor(day.count), 
                borderRadius: '3px' 
              }} 
            />
          ))}
        </div>
      </div>

      <Tabs items={['Notes', 'Repositories', 'Activity', 'About']} />
      <h2 className="section-title-standalone">Published Notes</h2>
      <NoteGrid notes={notes} />
    </div>
  )
}
