import { Box, Code, Database, Globe, Settings, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { topics } from '../../data/mockData.js'

const iconMap = { Box, Code, Database, Globe, Settings, TrendingUp, Sparkles: Code, FileText: Box, GitBranch: Globe, Lightbulb: TrendingUp }

export default function BrowseTopics({ topics: apiTopics }) {
  const list = apiTopics?.length ? apiTopics : topics
  return (
    <section className="panel-section">
      <div className="section-header">
        <h2>Browse by Topics</h2>
        <Link to="/explore">View all</Link>
      </div>
      <div className="topics-grid">
        {list.map((topic) => {
          const Icon = iconMap[topic.icon] || Box
          const slug = topic.slug || topic.name.toLowerCase().replace(/\s+/g, '-')
          const path = slug === 'ml' || slug === 'nlp' || slug === 'projects' ? `/explore?topic=${slug}` : `/${slug === 'data-structures' ? 'dsa' : slug}`
          return (
            <Link to={path} className="topic-card" key={topic.id} style={{ '--topic-color': topic.color }}>
              <div className="topic-icon"><Icon size={22} /></div>
              <h3>{topic.name}</h3>
              <p>{topic.notes.toLocaleString()} notes</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
