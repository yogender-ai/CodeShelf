import { Activity, CheckCircle, Clock, FileText, GitBranch, Globe, Mail, Users, XCircle } from 'lucide-react'
import { accessRequests } from '../data/mockData.js'
import { Tabs } from './Explore.jsx'
import { PageTitle } from './Upload.jsx'

export default function Admin() {
  return (
    <div className="page">
      <PageTitle title="Admin Panel" subtitle="Manage access requests and platform content" />
      <div className="stats-grid">{[{ l: 'Pending Requests', v: 12, icon: Clock, c: '#f59e0b' }, { l: 'Contributors', v: 86, icon: Users, c: '#8b5cf6' }, { l: 'Total Notes', v: 1245, icon: FileText, c: '#3b82f6' }, { l: 'Active Today', v: 234, icon: Activity, c: '#10b981' }].map((s) => { const Icon = s.icon; return <div className="card admin-metric" key={s.l}><div style={{ color: s.c }}><Icon size={20} /></div><span><strong>{s.v}</strong><small>{s.l}</small></span></div> })}</div>
      <Tabs items={['Pending (3)', 'Approved', 'Rejected']} />
      <div className="list-stack">
        {accessRequests.map((request) => (
          <article className="card admin-request" key={request.id}>
            <header><div className="mini-author"><span className="avatar sm">{request.name.charAt(0)}</span><span><strong>{request.name}</strong><small>{request.submittedAt}</small></span></div><div className="row-actions"><button className="btn btn-approve"><CheckCircle size={14} /> Approve</button><button className="btn btn-danger"><XCircle size={14} /> Reject</button></div></header>
            <blockquote>{request.reason}</blockquote>
            <p className="admin-request-meta"><span><Mail size={12} /> {request.email}</span><span><GitBranch size={12} /> {request.github}</span>{request.portfolio ? <span><Globe size={12} /> {request.portfolio}</span> : null}</p>
            <div className="tags">{request.topics.map((topic) => <small key={topic}>{topic}</small>)}</div>
          </article>
        ))}
      </div>
    </div>
  )
}
