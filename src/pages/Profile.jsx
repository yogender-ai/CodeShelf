import { Calendar, Edit, GitBranch, Link as LinkIcon, MapPin } from 'lucide-react'
import { currentUser, topNotes } from '../data/mockData.js'
import { NoteGrid, Tabs } from './Explore.jsx'

export default function Profile() {
  return (
    <div className="page">
      <div className="profile-banner" />
      <section className="card profile-header-card">
        <div className="avatar xl">{currentUser.name.charAt(0)}</div>
        <div className="profile-copy">
          <h1>{currentUser.name}</h1>
          <p className="accent-text">{currentUser.role}</p>
          <p>Full-stack developer passionate about DSA and system design. Sharing what I learn in public.</p>
          <div className="profile-meta"><span><MapPin size={13} /> India</span><span><GitBranch size={13} /> github.com/aniketsingh</span><span><LinkIcon size={13} /> aniket.dev</span><span><Calendar size={13} /> Joined Jan 2024</span></div>
        </div>
        <button className="btn btn-secondary"><Edit size={14} /> Edit Profile</button>
      </section>
      <div className="stats-grid">{[{ l: 'Contributions', v: currentUser.contributions, c: '#8b5cf6' }, { l: 'Total Views', v: currentUser.views, c: '#3b82f6' }, { l: 'Likes Received', v: currentUser.likes, c: '#ef4444' }, { l: 'Repositories', v: 4, c: '#10b981' }].map((s) => <div className="card metric" key={s.l}><strong style={{ color: s.c }}>{s.v}</strong><span>{s.l}</span></div>)}</div>
      <Tabs items={['Notes', 'Repositories', 'Activity', 'About']} />
      <h2 className="section-title-standalone">Published Notes</h2>
      <NoteGrid notes={topNotes} />
    </div>
  )
}
