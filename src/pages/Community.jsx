import { Crown, Search } from 'lucide-react'
import { Tabs } from './Explore.jsx'
import { PageTitle } from './Upload.jsx'

const contributors = ['Aditya Verma', 'Neha Gupta', 'Rohit Yadav', 'Aniket Singh', 'Priya Sharma', 'Amit Kumar', 'Sneha Patel', 'Vikram Joshi']

export default function Community() {
  return (
    <div className="page">
      <PageTitle title="Community" subtitle="Meet the contributors making CodeShelf useful" />
      <div className="toolbar"><label className="search-field"><Search size={16} /><input placeholder="Search contributors..." /></label></div>
      <Tabs items={['All', 'Top Contributors', 'New Members', 'Most Active']} />
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
