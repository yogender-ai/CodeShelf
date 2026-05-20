import { Activity, Flame, Mail, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { activityApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { PageTitle } from './Upload.jsx'

export default function Profile() {
  const { user } = useAuth()
  const [streak, setStreak] = useState(null)
  const [activity, setActivity] = useState([])
  useEffect(() => {
    activityApi.streak().then(setStreak).catch(() => {})
    activityApi.activity().then((data) => setActivity(data.activity || [])).catch(() => {})
  }, [])
  return (
    <div className="page">
      <PageTitle title="Profile" subtitle="Your coding memory and revision stats." />
      <section className="card profile-header-card">
        <div className="avatar xl">{user?.name?.charAt(0) || 'C'}</div>
        <div className="profile-copy"><h1>{user?.name}</h1><p>{user?.email}</p><div className="profile-meta"><span><User size={14} /> CodeShelf learner</span><span><Mail size={14} /> Reminder-ready</span></div></div>
      </section>
      <div className="stats-grid">
        <Metric icon={Flame} label="Current Streak" value={streak?.current_streak || 0} />
        <Metric icon={Flame} label="Longest Streak" value={streak?.longest_streak || 0} />
        <Metric icon={Activity} label="Cards Today" value={streak?.cards_reviewed_today || 0} />
        <Metric icon={Activity} label="Minimum Cards" value={streak?.minimum_cards || 5} />
      </div>
      <section className="card">
        <h2>Recent Activity</h2>
        <div className="list-stack">{activity.map((day) => <article className="revision-row" key={day.date}><span>{day.date}</span><small>{day.cards_reviewed} cards · {day.mistakes_fixed} mistakes · {day.completed_today ? 'complete' : 'incomplete'}</small></article>)}</div>
      </section>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return <div className="card metric-card"><Icon size={22} /><strong>{value}</strong><span>{label}</span></div>
}
