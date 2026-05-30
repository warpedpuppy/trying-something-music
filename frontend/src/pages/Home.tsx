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
          Start reading music today
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
            <h2>Rhythm Training</h2>
            <p>
              Sheet music scrolls past — you tap along and the app listens in real time.
              Eight progressive levels from whole notes to sixteenth-note syncopation,
              plus Play Along mode for pressure-free practice at your own pace.
            </p>
            <span className="section-card-cta">
              {user ? 'Go to dashboard →' : 'Start training →'}
            </span>
          </div>
        </Link>

        <Link to="/rhythm/play-along" className="section-card section-card-playalong">
          <div className="section-card-icon">▶</div>
          <div>
            <h2>Play Along</h2>
            <p>
              Notation scrolls across the screen at a steady tempo. Tap in time —
              green dots mark hits, orange marks misses. Tempo rises as you improve,
              and more complex time signatures unlock as you master the basics.
            </p>
            <span className="section-card-cta">Play now →</span>
          </div>
        </Link>

        <Link to="/theory" className="section-card section-card-theory">
          <div className="section-card-icon">𝄞</div>
          <div>
            <h2>Music Theory</h2>
            <p>
              Twenty-plus interactive topics across three levels — from intervals and
              key signatures through counterpoint and jazz reharmonization. Every concept
              you can hear: tap to play cadences, chord progressions, intervals, and
              a synthesized excerpt of Bach.
            </p>
            <span className="section-card-cta">Explore theory →</span>
          </div>
        </Link>

      </section>

      <p className="home-footer-nudge">
        No account needed to start ·{' '}
        <Link to="/register">sign up free</Link> to track your progress across sessions
      </p>
    </div>
  )
}
