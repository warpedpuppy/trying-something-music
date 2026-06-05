import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'

export function Register() {
  usePageTitle('Create a Profile')
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (username !== confirm) {
      setError('The names don\'t match — please type the same name twice.')
      return
    }
    setSubmitting(true)
    try {
      await register(username)
      navigate('/rhythm/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card auth-card">
      <h1>Create a profile</h1>
      <p className="muted">
        No password needed. There's no data here important enough to require one,
        and since we don't collect email addresses, there'd be no way to recover
        a forgotten password anyway. Just pick a name.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="username">Choose a name</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            minLength={2}
            required
            placeholder="e.g. Alex"
          />
        </div>
        <div className="form-field">
          <label htmlFor="confirm">Type it again to confirm</label>
          <input
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="username"
            minLength={2}
            required
            placeholder="Same name again"
          />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="button-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create profile'}
        </button>
      </form>
      <p className="muted">
        Already have a profile? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
