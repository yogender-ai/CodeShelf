import { BookOpen, Code2, Database, Play } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HeroBanner() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Share. <span>Learn.</span> Grow Together.</h1>
        <p>A community-driven platform for DSA, SQL, and computer science concepts.</p>
        <div className="hero-actions">
          <Link to="/explore" className="btn btn-primary"><BookOpen size={16} /> Explore Notes</Link>
          <button className="btn btn-secondary"><Play size={16} /> How it works</button>
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="hero-tile hero-tile-one"><Code2 size={30} /></div>
        <div className="hero-tile hero-tile-two"><Database size={30} /></div>
      </div>
    </section>
  )
}
