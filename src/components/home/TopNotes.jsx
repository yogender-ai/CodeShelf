import { Code, Database, Eye, FileText, GitBranch, Heart, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { topNotes } from '../../data/mockData.js'

const iconMap = { Code, Database, FileText, Sparkles: Code, GitBranch }

export default function TopNotes({ notes: apiNotes }) {
  const notes = apiNotes?.length ? apiNotes : topNotes
  const featured = notes.find((note) => note.repo) || notes[0]
  return (
    <section className="panel-section">
      <div className="section-header">
        <h2>Top Notes</h2>
        <div className="segmented">
          <button className="active">Recent</button>
          <button>Trending</button>
          <button>Most Liked</button>
        </div>
      </div>

      <div className="notes-grid">
        {notes.slice(0, 3).map((note) => {
          const Icon = iconMap[note.icon] || FileText
          return (
            <Link to={`/note/${note.id}`} key={note.id} className="note-card">
              <div className="note-cover" style={{ '--note-color': note.color }}>
                <Icon size={34} />
              </div>
              <div className="note-body">
                <div className="note-title-row">
                  <h3>{note.title}</h3>
                  {note.featured ? <span>Featured</span> : null}
                </div>
                <p>{note.description}</p>
                <div className="tags">{note.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
                <div className="note-footer">
                  <div className="mini-author"><div className="avatar xs">{note.author.charAt(0)}</div>{note.author}</div>
                  <span><Eye size={13} /> {note.views}</span>
                  <span><Heart size={13} /> {note.likes}</span>
                </div>
              </div>
            </Link>
          )
        })}
        <article className="github-feature-card">
          <div className="github-feature-header">
            <GitBranch size={22} />
            <div>
              <h3>Featured Repository</h3>
              <p>{featured?.repo || 'Add a repo link while creating a note'}</p>
            </div>
          </div>
          <div className="repo-metrics">
            <div><strong>{featured?.stars || 0}</strong><span>Stars</span></div>
            <div><strong>{featured?.forks || 0}</strong><span>Forks</span></div>
            <div><strong>{featured?.likes || 0}</strong><span>Likes</span></div>
            <div><strong>{featured?.views || 0}</strong><span>Views</span></div>
          </div>
          <Link to={featured ? `/note/${featured.id}` : '/upload'} className="btn btn-primary"><Star size={16} /> View Note</Link>
        </article>
      </div>
    </section>
  )
}
