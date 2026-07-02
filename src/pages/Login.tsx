import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'

export function Login() {
  usePageTitle('Open Profile')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/rhythm/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card auth-card">
      <h1>Open a local profile</h1>
      <p className="muted">No password needed — just type a profile name saved in this browser.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="username">Profile name</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="button-primary" disabled={submitting}>
          {submitting ? 'Opening…' : 'Open profile'}
        </button>
      </form>
      <p className="muted">
        New here? <Link to="/register">Create a local profile</Link>
      </p>
    </div>
  )
}
