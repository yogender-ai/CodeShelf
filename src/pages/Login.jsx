import { Code2, GitBranch } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Field } from './Upload.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: 'yogender@example.com', password: 'codeshelf123' })
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to CodeShelf">
      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Email"><input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></Field>
        <Field label="Password"><input className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" /></Field>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn-primary full">Sign In</button>
      </form>
      <p className="auth-footer">Do not have an account? <Link to="/signup">Sign up</Link></p>
    </AuthShell>
  )
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-card card">
        <Link to="/" className="auth-logo"><span><Code2 size={20} /></span> CodeShelf</Link>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <button className="btn btn-secondary full"><GitBranch size={16} /> Continue with GitHub</button>
        <div className="auth-divider"><span>or</span></div>
        {children}
      </section>
    </main>
  )
}
