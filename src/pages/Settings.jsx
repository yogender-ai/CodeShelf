import { Bell, GitBranch, Lock, Save, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import { Field, PageTitle } from './Upload.jsx'

const tabs = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: GitBranch },
]

export default function Settings() {
  const [active, setActive] = useState('account')
  return (
    <div className="page">
      <PageTitle title="Settings" subtitle="Manage your account and preferences" />
      <div className="settings-grid">
        <nav className="card settings-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return <button className={active === tab.id ? 'active' : ''} key={tab.id} onClick={() => setActive(tab.id)}><Icon size={16} /> {tab.label}</button>
          })}
        </nav>
        <section className="card form-card">
          {active === 'account' && <><h2>Account Information</h2><Field label="Full Name"><input className="input" defaultValue="Aniket Singh" /></Field><Field label="Email"><input className="input" defaultValue="aniket@example.com" /></Field><Field label="Bio"><textarea className="input" rows="3" defaultValue="Full-stack developer passionate about DSA and system design." /></Field><Field label="Website"><input className="input" defaultValue="https://aniket.dev" /></Field><button className="btn btn-primary"><Save size={14} /> Save Changes</button></>}
          {active === 'security' && <><h2>Security</h2><Field label="Current Password"><input className="input" type="password" /></Field><Field label="New Password"><input className="input" type="password" /></Field><button className="btn btn-primary">Update Password</button><div className="danger-zone"><h3>Danger Zone</h3><p>Once you delete your account, there is no going back.</p><button className="btn btn-danger"><Trash2 size={14} /> Delete Account</button></div></>}
          {active === 'notifications' && <><h2>Email Notifications</h2>{['Someone likes my note', 'Someone comments on my note', 'New followers', 'Weekly digest', 'Platform announcements'].map((item) => <label className="toggle-row" key={item}><span>{item}</span><input type="checkbox" defaultChecked /></label>)}</>}
          {active === 'integrations' && <><h2>Connected Accounts</h2><div className="integration-row"><span><GitBranch size={28} /> <span><strong>GitHub</strong><small>Connected as @aniketsingh</small></span></span><button className="btn btn-secondary">Disconnect</button></div><p className="muted">GitHub lets contributors link repositories to notes and showcase real work.</p></>}
        </section>
      </div>
    </div>
  )
}
