import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'

export function ComingSoon() {
  return (
    <div className="cs-root">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="cs-hero">
        <Logo showTagline height={130} className="cs-logo" />
        <p className="cs-sub">
          An interactive platform for learning rhythm and music theory —
          free, no account required to start, all data stays in your browser.
        </p>
        <div className="cs-hero-actions">
          <Link to="/rhythm/learn" className="cs-cta-primary">Start learning</Link>
          <Link to="/rhythm/play-along" className="cs-cta-secondary">▶ Play Along</Link>
        </div>
      </section>

      {/* ── Decorative staff ─────────────────────────────────────────────── */}
      <div className="cs-staff-divider" aria-hidden="true">
        <svg viewBox="0 0 900 48" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
          {[6,15,24,33,42].map(y => (
            <line key={y} x1="0" y1={y} x2="900" y2={y} stroke="currentColor" strokeWidth="0.8" />
          ))}
          <text x="14" y="44" fontSize="52" fontFamily="serif" fill="#6C63FF" opacity="0.5">𝄞</text>
          <text x="80"  y="29" fontSize="20" fontFamily="serif" fill="#6C63FF" opacity="0.4">♩</text>
          <text x="130" y="21" fontSize="20" fontFamily="serif" fill="#4361ee" opacity="0.35">♪</text>
          <text x="185" y="35" fontSize="20" fontFamily="serif" fill="#6C63FF" opacity="0.4">♩</text>
          <text x="240" y="17" fontSize="20" fontFamily="serif" fill="#4361ee" opacity="0.3">♩</text>
          <text x="295" y="29" fontSize="20" fontFamily="serif" fill="#6C63FF" opacity="0.45">♫</text>
          <text x="358" y="21" fontSize="20" fontFamily="serif" fill="#4361ee" opacity="0.35">♩</text>
          <text x="415" y="35" fontSize="20" fontFamily="serif" fill="#6C63FF" opacity="0.3">♪</text>
          <text x="468" y="17" fontSize="20" fontFamily="serif" fill="#4361ee" opacity="0.4">♩</text>
          <text x="525" y="29" fontSize="20" fontFamily="serif" fill="#6C63FF" opacity="0.35">♫</text>
          <text x="580" y="21" fontSize="20" fontFamily="serif" fill="#4361ee" opacity="0.3">♩</text>
          <text x="635" y="35" fontSize="20" fontFamily="serif" fill="#6C63FF" opacity="0.4">♪</text>
          <text x="692" y="17" fontSize="20" fontFamily="serif" fill="#4361ee" opacity="0.35">♩</text>
          <text x="748" y="29" fontSize="20" fontFamily="serif" fill="#6C63FF" opacity="0.3">♩</text>
          <text x="805" y="21" fontSize="20" fontFamily="serif" fill="#4361ee" opacity="0.4">♫</text>
          <text x="858" y="35" fontSize="20" fontFamily="serif" fill="#6C63FF" opacity="0.35">♪</text>
        </svg>
      </div>

      {/* ── Feature cards ────────────────────────────────────────────────── */}
      <div className="cs-features">

        <div className="cs-feature-card cs-feature-rhythm">
          <div className="cs-feature-icon">♩</div>
          <h2>Rhythm Training</h2>
          <p className="cs-feature-intro">
            Sheet music scrolls across the screen — you tap along and the app scores
            every note in real time. Eight progressive levels take you from whole notes
            to syncopated sixteenth patterns.
          </p>
          <ul className="cs-feature-list">
            <li>Eight levels from whole notes to complex 16th-note syncopation</li>
            <li>Free-tempo and metronome-lock modes — two distinct skills</li>
            <li>Scoring adapts to your internal pulse, not just the click track</li>
            <li>Visual counting syllables (1 e + a) show you inside every beat</li>
            <li>Progress dashboard tracks accuracy and improvement over time</li>
          </ul>
          <Link to="/rhythm/learn" className="cs-card-link">Start rhythm training →</Link>
        </div>

        <div className="cs-feature-card cs-feature-playalong">
          <div className="cs-feature-icon">▶</div>
          <h2>Play Along</h2>
          <p className="cs-feature-intro">
            A scrolling notation game with real scoring. Measures pan in from the right
            at a steady tempo — tap in time to turn notes green. Misses turn orange.
            No pressure, no lives — just you, the beat, and the music.
          </p>
          <ul className="cs-feature-list">
            <li>Metronome plays before you start so you feel the tempo first</li>
            <li>Orange arrow marks every downbeat so you never lose your place</li>
            <li>Tempo rises by 1 BPM every 10 clean measures, up to 80 BPM</li>
            <li>Ten consecutive misses resets the game — keep focused</li>
            <li>3/4 and 6/8 time signatures unlock as you improve</li>
            <li>Tap any measure to pause and hear it played back</li>
          </ul>
          <Link to="/rhythm/play-along" className="cs-card-link">Play now →</Link>
        </div>

        <div className="cs-feature-card cs-feature-theory">
          <div className="cs-feature-icon">𝄞</div>
          <h2>Music Theory</h2>
          <p className="cs-feature-intro">
            Twenty-plus interactive topics across Beginner, Intermediate, and Advanced
            levels. Every concept you can hear — not just read about. Tap to play
            cadences, chord progressions, intervals, and a synthesized Bach excerpt.
          </p>
          <ul className="cs-feature-list">
            <li><strong>Hear it live:</strong> play cadences, intervals, and progressions with one tap</li>
            <li>Bach's Invention No. 1 (BWV 772) — two-voice counterpoint, synthesized</li>
            <li>Circle of Fifths — all 12 keys, modes, diatonic chords</li>
            <li>Cadences, voice leading, secondary dominants, modal mixture</li>
            <li>Jazz harmony: chord symbols, tritone substitution, reharmonization</li>
            <li>Blues form, extended chords, counterpoint — Beginner through Advanced</li>
          </ul>
          <Link to="/theory" className="cs-card-link">Explore theory →</Link>
        </div>

      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="cs-footer">
        <p>
          TryingSomething.com &nbsp;·&nbsp;
          All data stored locally in your browser &nbsp;·&nbsp;
          No account needed to start &nbsp;·&nbsp;
          <Link to="/about" style={{ color: 'inherit', opacity: 0.7 }}>About this project</Link>
        </p>
      </footer>

    </div>
  )
}
