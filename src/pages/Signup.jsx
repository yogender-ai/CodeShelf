import { Link } from 'react-router-dom'
import { Field } from './Upload.jsx'
import { AuthShell } from './Login.jsx'

export default function Signup() {
  return <AuthShell title="Create your account" subtitle="Join developers learning together"><Field label="Full Name"><input className="input" placeholder="John Doe" /></Field><Field label="Email"><input className="input" type="email" placeholder="you@example.com" /></Field><Field label="Password"><input className="input" type="password" placeholder="At least 8 characters" /></Field><button className="btn btn-primary full">Create Account</button><p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p></AuthShell>
}
