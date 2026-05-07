import { FileText, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { notesApi } from '../api/client.js'
import { topNotes } from '../data/mockData.js'
import { NoteGrid, Tabs } from './Explore.jsx'

export default function TopicPage({ topic = 'DSA Notes', color = '#8b5cf6' }) {
  const apiTopic = useMemo(() => topic.replace(' Notes', '').replace('Repositories', 'Projects'), [topic])
  const [notes, setNotes] = useState(topNotes)
  const [search, setSearch] = useState('')

  useEffect(() => {
    notesApi.list({ topic: apiTopic === 'Concepts' ? 'Concepts' : apiTopic, search }).then((data) => setNotes(data.notes)).catch(() => setNotes(topNotes))
  }, [apiTopic, search])

  return (
    <div className="page">
      <section className="card topic-hero" style={{ '--topic-color': color }}>
        <div className="topic-hero-icon"><FileText size={28} /></div>
        <div><h1>{topic}</h1><p>Explore curated notes, questions, and concepts on {topic}.</p></div>
        <div className="topic-stats"><div><strong>1,245</strong><span>Notes</span></div><div><strong>340</strong><span>Contributors</span></div><div><strong>25k</strong><span>Views</span></div></div>
      </section>
      <div className="toolbar"><label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search in ${topic}...`} /></label></div>
      <Tabs items={['All', 'Beginner', 'Intermediate', 'Advanced', 'Most Liked']} />
      <NoteGrid notes={notes.length ? notes : topNotes} />
    </div>
  )
}
