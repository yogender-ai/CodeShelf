import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Field } from './Upload.jsx'
import { AuthShell } from './Login.jsx'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      await signup(form)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join developers learning together">
      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Full Name"><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="John Doe" /></Field>
        <Field label="Email"><input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></Field>
        <Field label="Password"><input className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></Field>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn-primary full">Create Account</button>
      </form>
      <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthShell>
  )
}
