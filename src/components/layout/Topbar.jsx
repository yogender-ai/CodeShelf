import { Bell, ChevronDown, Search, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { currentUser } from '../../data/mockData.js'

export default function Topbar() {
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
        <button className="icon-button notification-button" aria-label="Notifications">
          <Bell size={20} />
          <span />
        </button>
        <Link to="/profile" className="topbar-profile">
          <div className="avatar sm">{currentUser.name.charAt(0)}</div>
          <div>
            <strong>{currentUser.name}</strong>
            <small>{currentUser.role}</small>
          </div>
          <ChevronDown size={16} />
        </Link>
      </div>
    </header>
  )
}
