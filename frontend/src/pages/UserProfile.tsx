import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ProgressSummary } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { computeBadges } from '../lib/badges'
import { THEORY_TOPIC_SLUGS } from '../lib/badges'
import {
  findUserById,
  getPlayAlongBest,
  getTheoryVisits,
} from '../lib/localDb'
import { BadgeItem } from '../components/BadgeItem'
import { usePageTitle } from '../hooks/usePageTitle'

// Human-readable labels for theory topic slugs
const THEORY_TOPIC_LABELS: Record<string, string> = {
  'circle-of-fifths':    'Circle of Fifths',
  'notes':               'Notes & the Staff',
  'keys':                'Key Signatures',
  'intervals':           'Intervals',
  'scales':              'Scales',
  'chords':              'Triads & Chords',
  'cadences':            'Cadences',
  'progressions':        'Chord Progressions',
  'diatonic-harmony':    'Diatonic Harmony',
  'voice-leading':       'Voice Leading',
  'secondary-dominants': 'Secondary Dominants',
  'modal-mixture':       'Modal Mixture',
  'blues':               'The Blues',
  'chord-symbols':       'Chord Symbols',
  'modulation':          'Modulation',
  'modes':               'Modes',
  'extended-chords':     'Extended Chords',
  'tritone-sub':         'Tritone Substitution',
  'counterpoint':        'Counterpoint',
  'form':                'Form & Structure',
  'reharmonization':     'Reharmonization',
}

function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export function UserProfile() {
  usePageTitle('Your Profile')
  const { user } = useAuth()
  const [progress, setProgress] = useState<ProgressSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    api.getProgress()
      .then((p) => { if (!cancelled) setProgress(p) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load') })
    return () => { cancelled = true }
  }, [user?.id])

  if (!user) return null
  if (error)    return <p className="error-text">{error}</p>
  if (!progress) return <p className="page-loading">Loading…</p>

  const localUser     = findUserById(user.id)
  const best          = getPlayAlongBest(user.id)
  const theoryVisits  = getTheoryVisits(user.id)
  const visitedSet    = new Set(theoryVisits)
  const topicsVisited = THEORY_TOPIC_SLUGS.filter(s => visitedSet.has(s)).length
  const badges        = computeBadges(user.id)
  const earnedCount   = badges.filter(b => b.earned).length

  return (
    <div className="profile-page">

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="profile-avatar" aria-hidden="true">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="profile-username">{user.username}</h1>
          {localUser?.createdAt && (
            <p className="profile-since">Member since {formatDate(localUser.createdAt)}</p>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="stat-grid">
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
          <div className="stat-label">Play Along best streak</div>
        </div>
      </div>

      {/* ── Badges ── */}
      <div className="badge-section">
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

      {/* ── Theory progress ── */}
      <div className="profile-section">
        <h2>
          Theory topics
          <span className="badge-count">{topicsVisited} / {THEORY_TOPIC_SLUGS.length}</span>
        </h2>
        <div className="profile-topic-grid">
          {THEORY_TOPIC_SLUGS.map(slug => (
            <span
              key={slug}
              className={`concept-pill${visitedSet.has(slug) ? ' mastered' : ''}`}
            >
              {visitedSet.has(slug) ? '✓ ' : ''}{THEORY_TOPIC_LABELS[slug] ?? slug}
            </span>
          ))}
        </div>
      </div>

      {/* ── Concepts mastered ── */}
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

    </div>
  )
}
