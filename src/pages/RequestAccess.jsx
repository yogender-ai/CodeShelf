import { CheckCircle, Github, Globe, Linkedin, Sparkles } from 'lucide-react'
import { Field, PageTitle } from './Upload.jsx'

export default function RequestAccess() {
  return (
    <div className="page">
      <section className="request-hero">
        <div><Sparkles size={28} /></div>
        <PageTitle title="Become a Contributor" subtitle="Join a curated community sharing high-quality DSA, SQL, and CS content." />
      </section>
      <div className="form-grid">
        <form className="card form-card">
          <h2>Application Form</h2>
          <Field label="Full Name *"><input className="input" placeholder="Your name" /></Field>
          <Field label="Email *"><input className="input" type="email" placeholder="you@example.com" /></Field>
          <Field label="GitHub Username *"><input className="input" placeholder="github.com/yourusername" /></Field>
          <Field label="LinkedIn"><input className="input" placeholder="linkedin.com/in/yourusername" /></Field>
          <Field label="Portfolio"><input className="input" placeholder="https://yourwebsite.com" /></Field>
          <Field label="Why do you want to contribute? *"><textarea className="input" rows="4" placeholder="Tell us about your experience and what you want to share..." /></Field>
          <div className="field"><span>Topics you can contribute to *</span><div className="checkbox-grid">{['DSA', 'SQL', 'System Design', 'Algorithms', 'Web Dev', 'AI/ML'].map((topic) => <label key={topic}><input type="checkbox" /> {topic}</label>)}</div></div>
          <button className="btn btn-primary full"><Sparkles size={16} /> Submit Application</button>
        </form>
        <aside className="side-stack">
          <section className="card"><h3>Why Become a Contributor?</h3><ul className="icon-list"><li><CheckCircle /> Build your developer brand</li><li><Github /> Showcase your repos</li><li><Globe /> Help learners worldwide</li><li><Linkedin /> Grow your network</li></ul></section>
          <section className="card"><h3>Approval Process</h3><ol className="number-list"><li>Submit application</li><li>Admin reviews within 48 hours</li><li>You receive a decision</li><li>Start publishing</li></ol></section>
        </aside>
      </div>
    </div>
  )
}
