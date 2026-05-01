import { ExternalLink, GitFork, Github, Plus, Star } from 'lucide-react'
import { repos } from '../data/mockData.js'
import { PageTitle } from './Upload.jsx'

export default function MyRepositories() {
  return (
    <div className="page">
      <div className="split-header"><PageTitle title="My Repositories" subtitle="Linked GitHub repositories from your profile" /><button className="btn btn-primary"><Plus size={16} /> Connect Repo</button></div>
      <div className="repo-grid">
        {repos.map((repo) => (
          <article className="card repo-card" key={repo.name}>
            <header><Github size={18} /><strong>{repo.name}</strong><ExternalLink size={14} /></header>
            <p>{repo.desc}</p>
            <footer><span><i style={{ background: repo.langColor }} />{repo.lang}</span><span><Star size={12} /> {repo.stars}</span><span><GitFork size={12} /> {repo.forks}</span><small>Updated {repo.updated}</small></footer>
          </article>
        ))}
      </div>
    </div>
  )
}
