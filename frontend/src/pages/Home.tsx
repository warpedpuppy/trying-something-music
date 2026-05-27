import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { MusicNoteCanvas } from '../components/MusicNoteCanvas'

export function Home() {
  const { user } = useAuth()
  const [beatLabel, setBeatLabel] = useState('')
  const [flashKey,  setFlashKey]  = useState(0)

  const handleBeatLabel = useCallback((label: string) => {
    setBeatLabel(label)
    setFlashKey(k => k + 1)
  }, [])

  return (
    <div>
      {/* Hero with music note animation */}
      <section className="home-hero">
        <MusicNoteCanvas onBeatLabel={handleBeatLabel} />
      </section>

      <div className="home-tap-wrap">
        <p
          key={flashKey}
          className="home-beat-label"
          style={{ animation: beatLabel ? 'beat-label-flash 1.5s ease-out forwards' : 'none' }}
        >
          {beatLabel}
        </p>
        <Link
          to={user ? '/rhythm/dashboard' : '/rhythm/learn'}
          className="home-cta-btn"
        >
          learn how to read rhythm in sheet music!
        </Link>
      </div>

      {/* Section chooser */}
      <section className="section-chooser">
        <Link
          to={user ? '/rhythm/dashboard' : '/rhythm/learn'}
          className="section-card section-card-rhythm"
        >
          <div className="section-card-icon">♩</div>
          <div>
            <h2>Rhythm</h2>
            <p>
              Read sheet music notation and tap the rhythm. The trainer listens, scores each
              tap, and adapts to your level as you improve.
            </p>
            <span className="section-card-cta">
              {user ? 'Go to dashboard →' : 'Start learning →'}
            </span>
          </div>
        </Link>

        <Link to="/theory" className="section-card section-card-theory">
          <div className="section-card-icon">𝄞</div>
          <div>
            <h2>Theory</h2>
            <p>
              Intervals, scales, chords, key signatures — the vocabulary that unlocks
              every piece of music you'll ever encounter.
            </p>
            <span className="section-card-cta">Explore theory →</span>
          </div>
        </Link>
      </section>

      <p className="home-footer-nudge">
        Try it now ·{' '}
        <Link to="/register">create a free account</Link> to track your progress
      </p>
    </div>
  )
}
