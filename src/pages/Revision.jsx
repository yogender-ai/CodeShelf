import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { notesApi } from '../api/client.js'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { topNotes } from '../data/mockData.js'

export default function Revision() {
  const { topic } = useParams()
  const [notes, setNotes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notesApi.list({ topic: topic })
      .then((data) => {
        setNotes(data.notes.length ? data.notes : topNotes)
        setLoading(false)
      })
      .catch(() => {
        setNotes(topNotes)
        setLoading(false)
      })
  }, [topic])

  if (loading) return <div className="page">Loading flashcards...</div>
  if (!notes.length) return <div className="page">No notes found for {topic}.</div>

  const note = notes[currentIndex]

  const nextCard = () => {
    setFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % notes.length)
  }

  const prevCard = () => {
    setFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + notes.length) % notes.length)
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ alignSelf: 'flex-start', marginBottom: '20px' }}>
        <Link to={`/${topic === 'dsa' ? 'dsa' : topic}`} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Topic
        </Link>
      </div>

      <div style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>
        Card {currentIndex + 1} of {notes.length}
      </div>

      <div 
        style={{ 
          width: '100%', 
          maxWidth: '600px', 
          height: '400px', 
          cursor: 'pointer', 
          position: 'relative',
          perspective: '1000px'
        }}
        onClick={() => setFlipped(!flipped)}
      >
        <div style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          backfaceVisibility: 'hidden',
          transition: 'transform 0.6s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          background: 'var(--card)',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: '24px', textAlign: 'center', color: note.color || '#8b5cf6' }}>{note.title}</h2>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {note.tags?.map(tag => (
              <span key={tag} style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{tag}</span>
            ))}
          </div>
          <p style={{ marginTop: '40px', color: 'var(--text-muted)' }}>Click to flip</p>
        </div>

        <div style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          backfaceVisibility: 'hidden',
          transition: 'transform 0.6s',
          transform: flipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
          padding: '30px',
          background: 'var(--card-hover)',
          borderRadius: '12px',
          border: '1px solid var(--primary)',
          overflowY: 'auto'
        }}>
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6', color: 'var(--text)' }}>
            {note.content}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '30px' }}>
        <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); prevCard(); }}><ArrowLeft size={16} /> Prev</button>
        <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setFlipped(!flipped); }}><RotateCcw size={16} /> Flip</button>
        <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); nextCard(); }}>Next <ArrowRight size={16} /></button>
      </div>
    </div>
  )
}
