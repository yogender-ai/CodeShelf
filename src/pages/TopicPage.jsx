import { FileText, Search } from 'lucide-react'
import { topNotes } from '../data/mockData.js'
import { NoteGrid, Tabs } from './Explore.jsx'

export default function TopicPage({ topic = 'DSA Notes', color = '#8b5cf6' }) {
  return (
    <div className="page">
      <section className="card topic-hero" style={{ '--topic-color': color }}>
        <div className="topic-hero-icon"><FileText size={28} /></div>
        <div><h1>{topic}</h1><p>Explore curated notes, questions, and concepts on {topic}.</p></div>
        <div className="topic-stats"><div><strong>1,245</strong><span>Notes</span></div><div><strong>340</strong><span>Contributors</span></div><div><strong>25k</strong><span>Views</span></div></div>
      </section>
      <div className="toolbar"><label className="search-field"><Search size={16} /><input placeholder={`Search in ${topic}...`} /></label></div>
      <Tabs items={['All', 'Beginner', 'Intermediate', 'Advanced', 'Most Liked']} />
      <NoteGrid notes={[...topNotes, ...topNotes]} />
    </div>
  )
}
