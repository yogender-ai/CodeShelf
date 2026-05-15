import { Bell, ChevronDown, Flame, Search, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { currentUser } from '../../data/mockData.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Topbar() {
  const { user } = useAuth()
  const activeUser = user || currentUser
  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} />
        <input type="text" placeholder="Search notes, topics, questions..." />
        <kbd>Ctrl K</kbd>
      </div>

      <div className="topbar-actions">
        <Link to="/upload" className="topbar-upload">
          <Upload size={16} /> Upload
        </Link>
        <div className="topbar-streak" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 'bold' }} title={`Streak: ${activeUser.streakCount || 0} days`}>
          <Flame size={20} />
          <span>{activeUser.streakCount || 0}</span>
        </div>
        <button className="icon-button notification-button" aria-label="Notifications">
          <Bell size={20} />
          <span />
        </button>
        <Link to="/profile" className="topbar-profile">
          <div className="avatar sm">{activeUser.name.charAt(0)}</div>
          <div>
            <strong>{activeUser.name}</strong>
            <small>{activeUser.role}</small>
          </div>
          <ChevronDown size={16} />
        </Link>
      </div>
    </header>
  )
}
