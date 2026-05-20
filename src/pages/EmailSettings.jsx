import { Mail, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { emailApi } from '../api/client.js'
import { Field, PageTitle } from './Upload.jsx'

export default function EmailSettings() {
  const [prefs, setPrefs] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState('')
  useEffect(() => { emailApi.preferences().then((data) => setPrefs(data.preferences)) }, [])
  const update = (key, value) => setPrefs((current) => ({ ...current, [key]: value }))
  async function save() { const data = await emailApi.updatePreferences(prefs); setPrefs(data.preferences); setMessage('Email preferences saved.') }
  async function loadPreview() { setPreview(await emailApi.preview()) }
  async function sendTest() { const data = await emailApi.sendTest(); setMessage(`Email ${data.status}.`) }
  if (!prefs) return <div className="page"><p className="muted">Loading email settings...</p></div>
  return (
    <div className="page">
      <PageTitle title="Email Reminders" subtitle="Email is only a reminder. Your revision happens inside CodeShelf." />
      <div className="dashboard-grid">
        <section className="card form-card">
          <h2><Mail size={18} /> Preferences</h2>
          <Field label="Enabled"><select className="input" value={String(prefs.enabled)} onChange={(e) => update('enabled', e.target.value === 'true')}><option value="true">Enabled</option><option value="false">Disabled</option></select></Field>
          <Field label="Email Time"><input className="input" value={prefs.email_time} onChange={(e) => update('email_time', e.target.value)} /></Field>
          <Field label="Timezone"><input className="input" value={prefs.timezone} onChange={(e) => update('timezone', e.target.value)} /></Field>
          <Field label="Daily Card Count"><input className="input" type="number" value={prefs.daily_card_count} onChange={(e) => update('daily_card_count', Number(e.target.value))} /></Field>
          <div className="form-actions"><button className="btn btn-primary" onClick={save}>Save</button><button className="btn btn-secondary" onClick={loadPreview}>Preview</button><button className="btn btn-secondary" onClick={sendTest}><Send size={16} /> Send Test</button></div>
          {message ? <p className="recall-answer">{message}</p> : null}
        </section>
        <section className="card"><h2>Email Preview</h2>{preview ? <><strong>{preview.subject}</strong><pre className="email-preview">{preview.body}</pre></> : <p className="muted">Generate a preview to see today’s reminder.</p>}</section>
      </div>
    </div>
  )
}
