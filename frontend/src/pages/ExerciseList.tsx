import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PIECES } from '../lib/sheetMusicData'
import { api } from '../api/client'
import type { ExerciseListItem } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { skipToLevel } from '../lib/progression'

const LEVEL_NAMES: Record<number, string> = {
  1: 'Quarter & half notes',
  2: 'Whole notes & time signatures',
  3: 'Rests',
  4: 'Eighth notes',
  5: 'Dotted notes',
  6: 'Ties',
  7: 'Sixteenths & syncopation',
  8: 'Advanced syncopation & compound rhythm',
}

const SKIP_OPTIONS = [
  { level: 3, label: 'Intermediate', sublabel: 'Level 3 — Rests' },
  { level: 5, label: 'Advanced',     sublabel: 'Level 5 — Dotted notes' },
  { level: 7, label: 'Expert',       sublabel: 'Level 7 — Sixteenths' },
  { level: 8, label: 'Advanced',     sublabel: 'Level 8 — Advanced syncopation' },
]

export function ExerciseList() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<ExerciseListItem[] | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [refresh, setRefresh]     = useState(0)

  useEffect(() => {
    let cancelled = false
    api
      .listExercises()
      .then((data) => { if (!cancelled) setExercises(data) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load') })
    return () => { cancelled = true }
  }, [refresh])

  function handleSkipToLevel(level: number) {
    if (!user) return
    skipToLevel(user.id, level)
    setRefresh((c) => c + 1)
  }

  const byLevel = useMemo(() => {
    const groups = new Map<number, ExerciseListItem[]>()
    for (const exercise of exercises ?? []) {
      const group = groups.get(exercise.level) ?? []
      group.push(exercise)
      groups.set(exercise.level, group)
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0])
  }, [exercises])

  // Only show skip options for levels not yet unlocked
  const maxUnlocked  = exercises ? Math.max(...exercises.filter((e) => !e.locked).map((e) => e.level), 1) : 1
  const visibleSkips = SKIP_OPTIONS.filter((o) => o.level > maxUnlocked)

  if (error) return <p className="error-text">{error}</p>
  if (!exercises) return <p className="page-loading">Loading exercises…</p>

  return (
    <div>
      <h1>Exercises</h1>

      {/* ── Sheet Music Game section ── */}
      <section className="game-promo-section">
        <div className="game-promo-header">
          <h2 className="game-promo-title">Sheet Music Game</h2>
          <p className="game-promo-desc">
            Tap along to real public-domain pieces at your own pace. Change the tempo on the fly — green means on time, red means miss. Ten misses and the game resets.
          </p>
          <div className="game-promo-pieces">
            {PIECES.map(p => (
              <span key={p.id} className="game-promo-piece-tag">{p.title}</span>
            ))}
          </div>
          <Link to="/rhythm/game" className="game-promo-btn">Play now →</Link>
        </div>
      </section>

      <p className="muted">
        Pass two exercises at your highest unlocked level to open the next one.
      </p>

      {visibleSkips.length > 0 && (
        <div className="skip-level-section">
          <p className="skip-level-label">Already have some experience? Jump ahead:</p>
          <div className="skip-level-buttons">
            {visibleSkips.map((opt) => (
              <button
                key={opt.level}
                type="button"
                className="skip-level-btn"
                onClick={() => handleSkipToLevel(opt.level)}
              >
                <span className="skip-level-btn-label">{opt.label}</span>
                <span className="skip-level-btn-sub">{opt.sublabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {byLevel.map(([level, items]) => {
        const locked = items.every((item) => item.locked)
        return (
          <section key={level} className="level-group">
            <h2>
              Level {level}: {LEVEL_NAMES[level] ?? items[0].concept.replace('-', ' ')}
              {locked && <span className="level-locked-tag">🔒 locked</span>}
            </h2>
            <div className="exercise-grid">
              {items.map((exercise) => (
                <Link
                  key={exercise.id}
                  to={`/rhythm/exercises/${exercise.id}`}
                  className={`exercise-card${exercise.locked ? ' locked' : ''}`}
                  aria-disabled={exercise.locked}
                >
                  <span className="exercise-card-title">
                    {exercise.title}
                    {exercise.passed && <span className="passed-badge">✓ passed</span>}
                  </span>
                  <span className="exercise-card-meta">
                    {exercise.time_sig_top}/{exercise.time_sig_bottom} ·{' '}
                    {exercise.num_measures} measure{exercise.num_measures > 1 ? 's' : ''} ·{' '}
                    {exercise.attempt_count} attempt{exercise.attempt_count === 1 ? '' : 's'}
                  </span>
                  <span className="exercise-card-meta">{exercise.description}</span>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
