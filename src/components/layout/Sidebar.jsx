import { NavLink } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Code2,
  Compass,
  Database,
  FileText,
  GitBranch,
  GitPullRequest,
  HelpCircle,
  Home,
  Lightbulb,
  LogOut,
  Settings,
  Sparkles,
  Star,
  Trophy,
  Upload,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const mainLinks = [
  { name: 'Home', icon: Home, path: '/' },
  { name: 'Explore', icon: Compass, path: '/explore' },
  { name: 'DSA Notes', icon: BookOpen, path: '/dsa' },
  { name: 'SQL Notes', icon: Database, path: '/sql' },
  { name: 'ML Notes', icon: Sparkles, path: '/ml' },
  { name: 'NLP Notes', icon: FileText, path: '/nlp' },
  { name: 'Concepts', icon: Lightbulb, path: '/concepts' },
  { name: 'Questions', icon: HelpCircle, path: '/questions' },
  { name: 'Repositories', icon: GitBranch, path: '/repos' },
  { name: 'Community', icon: Users, path: '/community' },
  { name: 'LeetCode Sync', icon: Trophy, path: '/leetcode' },
]

const contributorLinks = [
  { name: 'My Contributions', icon: FileText, path: '/my-contributions' },
  { name: 'Upload Content', icon: Upload, path: '/upload' },
  { name: 'My Repositories', icon: GitBranch, path: '/my-repos' },
  { name: 'Request Access', icon: GitPullRequest, path: '/request-access', badge: true },
  { name: 'Bookmarks', icon: Star, path: '/explore' },
  { name: 'Notifications', icon: Bell, path: '/profile' },
]

const accountLinks = [
  { name: 'Profile', icon: User, path: '/profile' },
  { name: 'Settings', icon: Settings, path: '/settings' },
  { name: 'Admin', icon: Settings, path: '/admin' },
  { name: 'Sign Out', icon: LogOut, path: '/login' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Code2 size={20} />
        </div>
        <span>CodeShelf</span>
      </NavLink>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          {mainLinks.map((link) => <NavItem key={link.name} {...link} />)}
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-title">Contributor</p>
          {contributorLinks.map((link) => <NavItem key={link.name} {...link} />)}
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-title">Account</p>
          {accountLinks.map((link) => <NavItem key={link.name} {...link} onClick={link.name === 'Sign Out' ? logout : undefined} />)}
        </div>
      </nav>

      <div className="sidebar-cta">
        <h3>Become a Contributor</h3>
        <p>Share your knowledge with thousands of learners.</p>
        <NavLink to="/request-access" className="sidebar-cta-btn">
          Request Access <Sparkles size={14} />
        </NavLink>
      </div>
    </aside>
  )
}

function NavItem({ name, icon: Icon, path, badge, onClick }) {
  return (
    <NavLink to={path} onClick={onClick} end={path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
      <Icon size={16} />
      <span>{name}</span>
      {badge ? <span className="nav-badge" /> : null}
    </NavLink>
  )
}
