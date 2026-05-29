import { Logo } from '../components/Logo'

export function ComingSoon() {
  return (
    <div className="cs-root">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="cs-hero">
        <div className="cs-badge">✦ Now in development</div>
        <Logo showTagline height={130} className="cs-logo" />
        <p className="cs-sub">
          An interactive platform for learning rhythm and music theory — launching soon.
        </p>
      </section>

      {/* ── Decorative staff ─────────────────────────────────────────────── */}
      <div className="cs-staff-divider" aria-hidden="true">
        <svg viewBox="0 0 900 48" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
          {[6,15,24,33,42].map(y => (
            <line key={y} x1="0" y1={y} x2="900" y2={y} stroke="currentColor" strokeWidth="0.8" />
          ))}
          {/* Treble clef symbol */}
          <text x="14" y="44" fontSize="52" fontFamily="serif" fill="#6C63FF" opacity="0.5">𝄞</text>
          {/* Some note glyphs scattered along the staff */}
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
            Sheet music scrolls across the screen — you tap along and the app listens.
            Built for real musicians who want to read rhythm fluently, not just passively.
          </p>
          <ul className="cs-feature-list">
            <li>8 progressive levels, from whole notes to complex 16th-note patterns</li>
            <li>Free-tempo mode and metronome lock — two very different skills</li>
            <li>Real-time scoring that adapts to your own internal pulse</li>
            <li>Play Along: endless scrolling notation at your own tempo, no pressure</li>
            <li>Click any measure mid-scroll to pause and hear it played with a count-in</li>
            <li>Visual counting syllables (1 e + a) so you can see inside the beat</li>
          </ul>
        </div>

        <div className="cs-feature-card cs-feature-theory">
          <div className="cs-feature-icon">𝄞</div>
          <h2>Music Theory</h2>
          <p className="cs-feature-intro">
            Not a lecture series — interactive tools that make abstract theory tangible.
            Understand why music works, not just what the rules say.
          </p>
          <ul className="cs-feature-list">
            <li>Interactive Circle of Fifths — explore all 12 keys, modes, and diatonic chords</li>
            <li>Notes, intervals, scales, and triads with visual feedback</li>
            <li>Chord progressions and cadences — the grammar of tonal music</li>
            <li>Voice leading, secondary dominants, borrowed chords</li>
            <li>Jazz harmony: chord symbols, tritone substitution, reharmonization</li>
            <li>Three levels — Beginner through Advanced — jump in wherever you are</li>
          </ul>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="cs-footer">
        <p>TryingSomething.com &nbsp;·&nbsp; All data stored locally in your browser &nbsp;·&nbsp; No account needed to start</p>
      </footer>

    </div>
  )
}
