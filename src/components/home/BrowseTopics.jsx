import { Box, Code, Database, Globe, Settings, TrendingUp } from 'lucide-react'
import { topics } from '../../data/mockData.js'

const iconMap = { Box, Code, Database, Globe, Settings, TrendingUp }

export default function BrowseTopics() {
  return (
    <section className="panel-section">
      <div className="section-header">
        <h2>Browse by Topics</h2>
        <button>View all</button>
      </div>
      <div className="topics-grid">
        {topics.map((topic) => {
          const Icon = iconMap[topic.icon]
          return (
            <article className="topic-card" key={topic.id} style={{ '--topic-color': topic.color }}>
              <div className="topic-icon"><Icon size={22} /></div>
              <h3>{topic.name}</h3>
              <p>{topic.notes.toLocaleString()} notes</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
