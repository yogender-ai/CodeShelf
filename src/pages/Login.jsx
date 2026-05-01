import { Code2, GitBranch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Field } from './Upload.jsx'

export default function Login() {
  return <AuthShell title="Welcome back" subtitle="Sign in to continue to CodeShelf" mode="login"><Field label="Email"><input className="input" type="email" placeholder="you@example.com" /></Field><Field label="Password"><input className="input" type="password" placeholder="Password" /></Field><button className="btn btn-primary full">Sign In</button><p className="auth-footer">Do not have an account? <Link to="/signup">Sign up</Link></p></AuthShell>
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
