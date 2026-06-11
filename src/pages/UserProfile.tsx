import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api/client'
import type { ProgressSummary } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { computeBadges } from '../lib/badges'
import { THEORY_TOPIC_SLUGS } from '../lib/badges'
import { SHOW_THEORY } from '../lib/featureFlags'
import {
  findUserById,
  getPlayAlongBest,
  getTheoryCompletions,
  getTheoryVisits,
  getUsers,
} from '../lib/localDb'
import { BadgeItem } from '../components/BadgeItem'
import { usePageTitle } from '../hooks/usePageTitle'
import { THEORY_LEVELS, THEORY_TOPIC_LABELS } from '../lib/theoryTopics'

function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

// ── Shared name-pair form (used for both login and create) ────────────────────

interface NameFormProps {
  mode: 'login' | 'create'
  onSubmit: (name: string) => Promise<void>
}

function NameForm({ mode, onSubmit }: NameFormProps) {
  const [name, setName]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (name !== confirm) {
      setError("The names don't match — please type the same name both times.")
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === 'login' ? 'No profile with that name exists.' : 'Could not create profile.')
    } finally {
      setSubmitting(false)
    }
  }

  const label1 = mode === 'login' ? 'Profile name' : 'Choose a name'
  const label2 = mode === 'login' ? 'Type it again to confirm' : 'Type it again to confirm'
  const btnLabel = submitting
    ? (mode === 'login' ? 'Logging in…' : 'Creating…')
    : (mode === 'login' ? 'Log in' : 'Create profile')

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '320px' }}>
      <div className="form-field">
        <label htmlFor={`nf-${mode}-name`}>{label1}</label>
        <input
          id={`nf-${mode}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="username"
          minLength={2}
          required
          placeholder={mode === 'create' ? 'e.g. Alex' : ''}
        />
      </div>
      <div className="form-field">
        <label htmlFor={`nf-${mode}-confirm`}>{label2}</label>
        <input
          id={`nf-${mode}-confirm`}
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
        {btnLabel}
      </button>
    </form>
  )
}

// ── Profile tab content: default "You" user ───────────────────────────────────

type ProfileSubTab = 'login' | 'create'

function DefaultUserProfileTab({
  hasNamedProfiles,
  onShowPrivacy,
}: {
  hasNamedProfiles: boolean
  onShowPrivacy: () => void
}) {
  const { login, register } = useAuth()
  const [subTab, setSubTab] = useState<ProfileSubTab>(hasNamedProfiles ? 'login' : 'create')

  return (
    <div style={{ marginTop: '22px' }}>
      {/* Sub-tabs — only shown when there are existing named profiles to log in to */}
      {hasNamedProfiles && (
        <div className="tt-tabs" role="tablist" style={{ marginBottom: '22px' }}>
          <button
            role="tab"
            type="button"
            aria-selected={subTab === 'login'}
            className={`tt-tab${subTab === 'login' ? ' active' : ''}`}
            onClick={() => setSubTab('login')}
          >
            Log in
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={subTab === 'create'}
            className={`tt-tab${subTab === 'create' ? ' active' : ''}`}
            onClick={() => setSubTab('create')}
          >
            Create a named profile
          </button>
        </div>
      )}

      {/* Log in sub-tab */}
      {subTab === 'login' && hasNamedProfiles && (
        <div className="profile-section" style={{ marginTop: 0 }}>
          <h2>Log in to a named profile</h2>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Type the name of a profile that already exists on this browser.
            Type it twice — that's the only verification needed.
          </p>
          <NameForm mode="login" onSubmit={login} />
        </div>
      )}

      {/* Create sub-tab */}
      {subTab === 'create' && (
        <div className="profile-section" style={{ marginTop: 0 }}>
          <h2>Create a named profile</h2>
          <p>
            Named profiles are useful when more than one person shares this browser.
            Each keeps its own rhythm level and badges completely separate.
          </p>
          <p>
            <strong>There is no password.</strong> There's no data here important
            enough to need one, and since this site collects no email addresses,
            there would be no way to help you recover a forgotten password anyway.
            Just pick a name. Everything stays on your device —{' '}
            <button type="button" className="link-button" onClick={onShowPrivacy}>
              learn how your data is stored
            </button>.
          </p>
          <div style={{ marginTop: '1.25rem' }}>
            <NameForm mode="create" onSubmit={register} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Profile tab content: named user ──────────────────────────────────────────

function NamedUserProfileTab() {
  const { logout, login } = useAuth()
  const [showSwitch, setShowSwitch] = useState(false)

  return (
    <div style={{ marginTop: '22px' }}>
      <div className="profile-section" style={{ marginTop: 0 }}>
        <h2>Log out</h2>
        <p className="muted">
          Logging out returns you to the default "You" profile. Your named
          profile's progress is saved and waiting whenever you come back.
        </p>
        <button type="button" className="button-secondary" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="profile-section">
        <h2>Switch to another named profile</h2>
        {!showSwitch ? (
          <button type="button" className="link-button" onClick={() => setShowSwitch(true)}>
            Switch to a different profile →
          </button>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: '1rem' }}>
              Type the name of an existing profile twice to switch to it.
            </p>
            <NameForm mode="login" onSubmit={login} />
            <button
              type="button"
              className="link-button"
              style={{ marginTop: '10px' }}
              onClick={() => setShowSwitch(false)}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Profile tabs ──────────────────────────────────────────────────────────────

type ProfileTab = 'overview' | 'privacy' | 'profile' | 'theory' | 'badges'

// ── Main component ────────────────────────────────────────────────────────────

export function UserProfile() {
  usePageTitle('Your Profile')
  const { user, isDefaultUser } = useAuth()
  const [progress, setProgress] = useState<ProgressSummary | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [tab, setTab]           = useState<ProfileTab>('overview')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    api.getProgress()
      .then((p) => { if (!cancelled) setProgress(p) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load') })
    return () => { cancelled = true }
  }, [user?.id])

  useEffect(() => { setTab('overview') }, [user?.id])

  if (!user)     return null
  if (error)     return <p className="error-text">{error}</p>
  if (!progress) return <p className="page-loading">Loading…</p>

  const localUser          = findUserById(user.id)
  const best               = getPlayAlongBest(user.id)
  const theoryVisits       = getTheoryVisits(user.id)
  const theoryCompletions  = getTheoryCompletions(user.id)
  const completionSet      = new Set(theoryCompletions)
  const visitedSet         = new Set(theoryVisits)
  const topicsVisited      = THEORY_TOPIC_SLUGS.filter(s => visitedSet.has(s)).length
  const badges             = computeBadges(user.id)
  const earnedCount        = badges.filter(b => b.earned).length

  const levelStats = THEORY_LEVELS.map(level => ({
    name: level.name,
    slugs: level.slugs,
    completed: level.slugs.filter(s => completionSet.has(s)).length,
    total: level.slugs.length,
  }))

  // Named profiles that exist in localStorage (excluding the default "You")
  const namedProfiles    = getUsers().filter(u => !u.isDefault)
  const hasNamedProfiles = namedProfiles.length > 0

  // Dynamic profile-tab label
  const profileTabLabel = isDefaultUser
    ? (hasNamedProfiles ? 'Log in / create a profile' : 'Create a named profile')
    : 'Log out'

  const TABS: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'privacy',  label: 'Your data' },
    { id: 'profile',  label: profileTabLabel },
    ...(SHOW_THEORY ? [{ id: 'theory' as ProfileTab, label: 'Theory' }] : []),
    { id: 'badges',   label: 'Badges' },
  ]

  return (
    <div className="profile-page">

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="profile-avatar" aria-hidden="true">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="profile-username">{user.username}</h1>
          {isDefaultUser
            ? <p className="profile-since">Your data is saved automatically — no account required.</p>
            : localUser?.createdAt && (
                <p className="profile-since">Member since {formatDate(localUser.createdAt)}</p>
              )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="tt-tabs" role="tablist" aria-label="Profile sections" style={{ marginBottom: '0' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            className={`tt-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════ OVERVIEW */}
      {tab === 'overview' && (
        <>
          <div className="stat-grid" style={{ marginTop: '22px' }}>
            <div className="stat-card">
              <div className="stat-value">{progress.unlocked_level} / {progress.max_level}</div>
              <div className="stat-label">Rhythm level</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{progress.total_passed_exercises}</div>
              <div className="stat-label">Exercises passed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{progress.total_attempts}</div>
              <div className="stat-label">Total attempts</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{best.maxCleanMeasures}</div>
              <div className="stat-label">Play Along best</div>
            </div>
            {SHOW_THEORY && levelStats.map(({ name, completed, total }) => (
              <div
                key={name}
                className={`stat-card${completed === total && total > 0 ? ' stat-card--complete' : ''}`}
                title={completed === total && total > 0 ? `All ${name} theory topics completed!` : undefined}
              >
                <div className="stat-value">
                  {completed}/{total}
                  {completed === total && total > 0 && <span className="stat-complete-star" aria-label="complete">★</span>}
                </div>
                <div className="stat-label">{name} theory</div>
              </div>
            ))}
          </div>

          {progress.concepts.length > 0 && (
            <div className="profile-section">
              <h2>Rhythm concepts</h2>
              <ul className="concept-list">
                {progress.concepts.map(c => (
                  <li
                    key={c.concept}
                    className={`concept-pill${c.mastered ? ' mastered' : ''}`}
                    title={`${c.passes} passed, ${c.fails} failed`}
                  >
                    {c.mastered ? '✓ ' : ''}{c.concept.replace('-', ' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════ PRIVACY */}
      {tab === 'privacy' && (
        <div style={{ marginTop: '22px' }}>
          <div className="profile-section" style={{ marginTop: 0 }}>
            <h2>Your data stays with you</h2>
            <p>
              Everything you do here is saved directly in <strong>your browser's local
              storage</strong> — the same place browsers keep settings and offline data. No
              account is required, and nothing is ever sent to a remote server. Not your
              progress, not your attempt history, not your name.{' '}
              <strong>No server anywhere in the world learns anything about you from this
              site.</strong>
            </p>
            <p>
              Named profiles — if you create one — are also stored only in your browser.
              No account is registered anywhere. No company holds your data.
              The username you pick is just a label so two people sharing a browser
              can keep their progress separate.
            </p>
          </div>
          <div className="profile-section profile-section--warning">
            <h2>⚠ One thing to know</h2>
            <p>
              Because everything lives in your browser,{' '}
              <strong>clearing your browser's local storage will erase all of it</strong> —
              your level and your badges — with no way to recover it.
              Most browsers offer this under "Clear site data" or "Clear cookies and cache."
              If that happens, you start fresh.
            </p>
            <p className="profile-warning-temper">
              That said: <em>repetition is education.</em> Re-tapping rhythms you've
              already passed just makes you more fluent. Starting over isn't a tragedy;
              it's more practice.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ PROFILE */}
      {tab === 'profile' && (
        isDefaultUser
          ? <DefaultUserProfileTab
              hasNamedProfiles={hasNamedProfiles}
              onShowPrivacy={() => setTab('privacy')}
            />
          : <NamedUserProfileTab />
      )}

      {/* ══════════════════════════════════════════════════════════ THEORY */}
      {tab === 'theory' && (
        <div style={{ marginTop: '22px' }}>
          {THEORY_LEVELS.map(level => {
            const done = level.slugs.filter(s => completionSet.has(s)).length
            const allDone = done === level.slugs.length
            return (
              <div key={level.name} className="profile-section">
                <h2>
                  {level.name}
                  <span className={`badge-count${allDone ? ' badge-count--complete' : ''}`}>
                    {done} / {level.slugs.length}
                    {allDone && ' ★'}
                  </span>
                </h2>
                <div className="profile-topic-grid">
                  {level.slugs.map(slug => {
                    const visited   = visitedSet.has(slug)
                    const completed = completionSet.has(slug)
                    return (
                      <span
                        key={slug}
                        className={`concept-pill${completed ? ' mastered' : visited ? ' visited' : ''}`}
                        title={completed ? 'Completed' : visited ? 'Visited' : 'Not yet visited'}
                      >
                        {completed ? '✓ ' : visited ? '· ' : ''}{THEORY_TOPIC_LABELS[slug] ?? slug}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <div className="profile-section">
            <h2>
              All topics
              <span className="badge-count">{topicsVisited} / {THEORY_TOPIC_SLUGS.length} visited</span>
            </h2>
            <p className="muted" style={{ fontSize: '0.88rem' }}>
              A topic is marked <strong>visited</strong> (·) when you open it, and{' '}
              <strong>completed</strong> (✓) when you click "I've got this" inside the topic page.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ BADGES */}
      {tab === 'badges' && (
        <div className="badge-section" style={{ marginTop: '22px' }}>
          <h2>
            Badges
            <span className="badge-count">{earnedCount} / {badges.length}</span>
          </h2>
          <div className="badge-grid">
            {badges.map(badge => (
              <BadgeItem key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
