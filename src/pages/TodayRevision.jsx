import { CheckCircle2, Eye, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { revisionApi } from '../api/client.js'
import { PageTitle } from './Upload.jsx'

const ratings = [
  ['forgot', 'I forgot'],
  ['hard', 'Hard'],
  ['good', 'Good'],
  ['easy', 'Easy'],
]

export default function TodayRevision() {
  const [data, setData] = useState(null)
  const [index, setIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { load() }, [])
  const cards = data?.cards || []
  const card = cards[index]
  const progress = useMemo(() => data?.progress || { done: 0, total: cards.length }, [data, cards.length])

  function load() {
    revisionApi.today().then(setData).catch((err) => setMessage(err.message))
  }

  async function review(rating) {
    if (!card) return
    const result = await revisionApi.review(card.id, rating)
    setMessage(`Reviewed. Next interval: ${result.card.interval_days} day(s).`)
    setShowAnswer(false)
    setIndex((current) => Math.min(current + 1, cards.length - 1))
    load()
  }

  return (
    <div className="page revision-page">
      <PageTitle title="Today Revision" subtitle="A focused mix of DSA, SQL, DevOps, mistakes, commands, and interview recall." />
      <div className="revision-progress card">
        <strong>{progress.done}/{progress.total} cards done</strong>
        <progress max={progress.total || 1} value={progress.done || 0} />
        <span>Streak: {data?.streak?.current || 0} days</span>
      </div>
      {message ? <p className="recall-answer">{message}</p> : null}
      {card ? (
        <section className="card review-card">
          <div className="tags"><small>{card.topic}</small><small>{card.card_type}</small><small>{card.difficulty}</small></div>
          <h2>{card.question}</h2>
          {showAnswer ? <p className="answer-block">{card.answer}</p> : <button className="btn btn-primary" onClick={() => setShowAnswer(true)}><Eye size={16} /> Show Answer</button>}
          {showAnswer ? <div className="rating-row">{ratings.map(([value, label]) => <button key={value} className="btn btn-secondary" onClick={() => review(value)}>{label}</button>)}</div> : null}
        </section>
      ) : (
        <section className="card review-card"><CheckCircle2 size={38} /><h2>Nothing due right now.</h2><p className="muted">Add more notes or problems to grow your revision queue.</p><button className="btn btn-secondary" onClick={load}><RotateCcw size={16} /> Refresh</button></section>
      )}
      {data?.weak_topics?.length ? <section className="card"><h3>Weak topics found today</h3><div className="topic-chip-row">{data.weak_topics.map((item) => <span className="topic-chip" key={item.topic}>{item.topic}</span>)}</div></section> : null}
    </div>
  )
}
