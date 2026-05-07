import { Crown, Plus, Search, Send, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { groupsApi } from '../api/client.js'
import { Tabs } from './Explore.jsx'
import { PageTitle } from './Upload.jsx'

const contributors = ['Aditya Verma', 'Neha Gupta', 'Rohit Yadav', 'Aniket Singh', 'Priya Sharma', 'Amit Kumar', 'Sneha Patel', 'Vikram Joshi']

export default function Community() {
  const [groups, setGroups] = useState([])
  const [groupName, setGroupName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [activeGroup, setActiveGroup] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    try {
      const data = await groupsApi.list()
      setGroups(data.groups)
      setActiveGroup((current) => current || data.groups[0]?.id || '')
    } catch (err) {
      setStatus('Login to create groups and share notes with friends.')
    }
  }

  async function createGroup(event) {
    event.preventDefault()
    if (!groupName.trim()) return
    await groupsApi.create({ name: groupName, description: 'Collaborative revision shelf' })
    setGroupName('')
    loadGroups()
  }

  async function addMember(event) {
    event.preventDefault()
    if (!activeGroup || !memberEmail.trim()) return
    try {
      await groupsApi.addMember(activeGroup, { email: memberEmail })
      setStatus('Member added to the group.')
      setMemberEmail('')
      loadGroups()
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <div className="page">
      <PageTitle title="Community" subtitle="Create study groups, add friends, and revise each other notes" />
      <div className="toolbar"><label className="search-field"><Search size={16} /><input placeholder="Search contributors..." /></label></div>
      <Tabs items={['Groups', 'Top Contributors', 'New Members', 'Most Active']} />
      <section className="group-workspace">
        <form className="card mini-form" onSubmit={createGroup}>
          <h3><Plus size={16} /> Make a Group</h3>
          <input className="input" value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="DSA + SQL friends" />
          <button className="btn btn-primary full">Create Group</button>
        </form>
        <form className="card mini-form" onSubmit={addMember}>
          <h3><UserPlus size={16} /> Add Friend</h3>
          <select className="input" value={activeGroup} onChange={(event) => setActiveGroup(event.target.value)}>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
          <input className="input" type="email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="friend@example.com" />
          <button className="btn btn-secondary full"><Send size={15} /> Add</button>
          {status ? <p className="muted">{status}</p> : null}
        </form>
      </section>
      <div className="group-grid">
        {groups.map((group) => (
          <article className="card group-card" key={group.id}>
            <h3>{group.name}</h3>
            <p>{group.description}</p>
            <div className="tags">{group.members.map((member) => <small key={member.id}>{member.name}</small>)}</div>
            <strong>{group.notes.length} shared notes</strong>
          </article>
        ))}
      </div>
      <div className="community-grid">
        {contributors.map((name, index) => (
          <article className="card community-card" key={name}>
            {index < 3 ? <Crown className="community-crown" size={18} /> : null}
            <div className="avatar xl">{name.charAt(0)}</div>
            <h3>{name}</h3>
            <p className="accent-text">{index === 0 ? 'Top Contributor' : 'Contributor'}</p>
            <div className="profile-stats-inline"><div><strong>{45 - index * 3}</strong><span>Notes</span></div><div><strong>{12 - index}k</strong><span>Views</span></div><div><strong>{(2.8 - index * 0.2).toFixed(1)}k</strong><span>Points</span></div></div>
            <button className="btn btn-secondary full">View Profile</button>
          </article>
        ))}
      </div>
    </div>
  )
}
