import { CheckCircle, FileText, FolderPlus, GitBranch, Heart, MessageCircle, Trophy, Eye } from 'lucide-react'
import { contributionStats, currentUser, recentActivity, topContributors } from '../../data/mockData.js'

const activityIcons = {
  like: { icon: Heart, color: '#ef4444' },
  comment: { icon: MessageCircle, color: '#f59e0b' },
  published: { icon: CheckCircle, color: '#10b981' },
  repo: { icon: FolderPlus, color: '#8b5cf6' },
}

export default function RightSidebar({ dashboard }) {
  const user = dashboard?.user || currentUser
  const stats = dashboard?.stats || contributionStats
  const activity = dashboard?.activity || recentActivity
  const contributors = dashboard?.contributors || topContributors

  return (
    <aside className="right-rail">
      <section className="card profile-card">
        <div className="profile-row">
          <div className="avatar lg">{user.name.charAt(0)}</div>
          <div>
            <h3>{user.name}</h3>
            <p>{user.role}</p>
          </div>
        </div>
        <div className="profile-stats-inline">
          <div><strong>{stats.notesPublished}</strong><span>Contributions</span></div>
          <div><strong>{stats.views}</strong><span>Views</span></div>
          <div><strong>{stats.likes}</strong><span>Likes</span></div>
        </div>
      </section>

      <section className="card">
        <div className="rail-header"><h3>Contribution Stats</h3><select><option>This Month</option></select></div>
        <div className="stat-list">
          <Stat icon={FileText} label="Notes Published" value={stats.notesPublished} color="#8b5cf6" />
          <Stat icon={Eye} label="Views" value={stats.views} color="#3b82f6" />
          <Stat icon={Heart} label="Likes" value={stats.likes} color="#ef4444" />
          <Stat icon={GitBranch} label="GitHub Repos Added" value={stats.reposAdded} color="#10b981" />
        </div>
        <div className="mini-chart" aria-label="Contribution chart">
          {[35, 62, 48, 74, 58, 86, 66, 92, 71, 55, 80, 68].map((value, index) => (
            <span key={index} style={{ height: `${value}%` }} />
          ))}
        </div>
      </section>

      <section className="card">
        <div className="rail-header"><h3>Recent Activity</h3><button>View all</button></div>
        <div className="activity-list">
          {activity.map((activity) => {
            const config = activityIcons[activity.type] || activityIcons.published
            const Icon = config.icon
            return (
              <div className="activity-item" key={activity.id}>
                <div className="activity-icon" style={{ color: config.color }}><Icon size={14} /></div>
                <div><p>{activity.text}</p><small>{activity.time || 'recently'}</small></div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card">
        <div className="rail-header"><h3>Top Contributors</h3><button>View leaderboard</button></div>
        <div className="contributors">
          {contributors.map((person) => (
            <div className="contributor-row" key={person.id}>
              <span className="rank">{person.rank}</span>
              <div className="avatar xs">{person.name.charAt(0)}</div>
              <div><strong>{person.name}</strong><small>{person.points} points</small></div>
              {person.rank <= 3 ? <Trophy size={15} /> : null}
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-row">
      <span><Icon size={14} style={{ color }} /> {label}</span>
      <strong>{value}</strong>
    </div>
  )
}
