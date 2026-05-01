import { ArrowLeft, Bookmark, Calendar, Eye, Github, Heart, Share2, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { topNotes } from '../data/mockData.js'

export default function NoteDetail() {
  const { id } = useParams()
  const note = topNotes.find((item) => item.id === Number(id)) || topNotes[0]

  return (
    <div className="page detail-page">
      <Link to="/explore" className="back-link"><ArrowLeft size={16} /> Back to Explore</Link>
      <div className="detail-grid">
        <main>
          <section className="detail-header">
            <div className="tags">{note.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
            <h1>{note.title}</h1>
            <p>{note.description}</p>
            <div className="detail-meta">
              <div className="mini-author"><span className="avatar sm">{note.author.charAt(0)}</span><span><strong>{note.author}</strong><small><Calendar size={11} /> {note.timeAgo}</small></span></div>
              <div><span><Eye size={14} /> {note.views} views</span><span><Heart size={14} /> {note.likes} likes</span></div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary"><Heart size={16} /> Like</button>
              <button className="btn btn-secondary"><Bookmark size={16} /> Save</button>
              <button className="btn btn-secondary"><Share2 size={16} /> Share</button>
            </div>
          </section>

          <article className="markdown card">
            <h2>Introduction</h2>
            <p>Dynamic Programming is an algorithmic technique for solving complex problems by breaking them into simpler subproblems and reusing previous results.</p>
            <h2>Key Concepts</h2>
            <ul>
              <li><strong>Memoization:</strong> top-down recursion with caching.</li>
              <li><strong>Tabulation:</strong> bottom-up iterative state building.</li>
              <li><strong>Optimal substructure:</strong> the final answer depends on smaller optimal answers.</li>
              <li><strong>Overlapping subproblems:</strong> the same states are computed repeatedly.</li>
            </ul>
            <h2>Example: Fibonacci</h2>
            <pre><code>{`int fib(int n) {
  if (n <= 1) return n;
  vector<int> dp(n + 1);
  dp[0] = 0;
  dp[1] = 1;
  for (int i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}`}</code></pre>
            <p>This page is wired to mock data now. The same layout can render markdown fetched from FastAPI later.</p>
          </article>
        </main>

        <aside className="detail-rail">
          <section className="card">
            <h3><Github size={16} /> Connected Repository</h3>
            <p className="repo-name">{note.repo}</p>
            <p className="muted"><Star size={12} /> {note.stars} stars - Updated {note.repoUpdated}</p>
            <button className="btn btn-secondary full"><Github size={14} /> View on GitHub</button>
          </section>
          <section className="card">
            <h3>Table of Contents</h3>
            <nav className="toc">
              <a href="#intro">Introduction</a>
              <a href="#concepts">Key Concepts</a>
              <a href="#example">Example: Fibonacci</a>
              <a href="#practice">Practice Problems</a>
            </nav>
          </section>
        </aside>
      </div>
    </div>
  )
}
