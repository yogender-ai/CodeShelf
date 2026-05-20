import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { problemsApi } from '../api/client.js'
import { PageTitle } from './Upload.jsx'

export default function ProblemDetail() {
  const { id } = useParams()
  const [problem, setProblem] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { problemsApi.get(id).then((data) => setProblem(data.problem)).catch((err) => setError(err.message)) }, [id])
  if (error) return <div className="page"><p className="form-error">{error}</p></div>
  if (!problem) return <div className="page"><p className="muted">Loading problem...</p></div>
  return (
    <div className="page">
      <Link to="/problems" className="back-link"><ArrowLeft size={16} /> Back to Problems</Link>
      <PageTitle title={problem.title} subtitle={`${problem.platform} · ${problem.topic} · ${problem.pattern || 'No pattern'} · ${problem.difficulty}`} />
      <div className="detail-grid">
        <main className="card markdown"><h2>Approach</h2><p>{problem.approach || 'No approach yet.'}</p><h2>Code</h2><pre className="code-panel">{problem.code || '// Add code later'}</pre></main>
        <aside className="detail-rail"><section className="card"><h3>Mistake</h3><p className="muted">{problem.mistake || 'No mistake logged.'}</p></section><section className="card"><h3>Complexity</h3><p>{problem.time_complexity || 'Time unknown'}</p><p>{problem.space_complexity || 'Space unknown'}</p></section></aside>
      </div>
    </div>
  )
}
