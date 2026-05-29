import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { setToken } from '../api/client'
import { Logo } from './Logo'

function isLocalhost(): boolean {
  const { hostname } = window.location
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

// ── Welcome modal content ─────────────────────────────────────────────────────

function RhythmWelcome({ onClose }: { onClose: () => void }) {
  return (
    <div className="welcome-modal">
      <div className="modal-header">
        <h2 className="modal-title">Welcome to Rhythm Training</h2>
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
      </div>

      <p className="welcome-intro">
        This section trains your ability to read and feel rhythm — the backbone of all music.
        Sheet music notation tells you exactly when to play; your job is to tap it accurately.
      </p>

      <div className="welcome-sections">
        <div className="welcome-section">
          <h3>How exercises work</h3>
          <ul className="welcome-list">
            <li>A rhythmic pattern is shown as sheet music notation.</li>
            <li>Press <strong>START</strong> and tap the big button once for each note.</li>
            <li>
              <strong>Free tempo</strong> — tap at whatever speed feels right. The app detects your
              internal pulse and grades you against it.
            </li>
            <li>
              <strong>With metronome</strong> — a count-in beat plays at the exercise's target tempo.
              Stay locked to it like a drummer in a band.
            </li>
            <li>
              Stuck? Press <strong>"I give up"</strong> to hear the rhythm played for you, then
              watch it again with counting syllables shown.
            </li>
          </ul>
        </div>

        <div className="welcome-section">
          <h3>Progression & levels</h3>
          <ul className="welcome-list">
            <li>Exercises are organised into levels 1–8, from whole notes to 16th-note patterns.</li>
            <li>Pass enough exercises at a level to unlock the next one.</li>
            <li>Struggle with a concept? Practice mode queues up extra reps of that specific rhythm type.</li>
            <li>Earn badges for milestones — first pass, perfect streak, mastering a concept, and more.</li>
          </ul>
        </div>

        <div className="welcome-section">
          <h3>Play Along</h3>
          <ul className="welcome-list">
            <li>No pressure, no score — just tap along to an endless scroll of generated notation.</li>
            <li>Set your own tempo with the slider or by tapping the "Tap tempo" button.</li>
            <li>Pause any time and click a measure to hear it played back with a metronome count-in.</li>
            <li>Patterns get gradually more complex and mix in different time signatures (4/4, 3/4, 6/8).</li>
          </ul>
        </div>

        <div className="welcome-section">
          <h3>Where to start</h3>
          <ul className="welcome-list">
            <li>
              <strong>New here?</strong> Go to <Link to="/rhythm/learn" onClick={onClose}>Learn</Link> for a
              quick explanation of notation, then try your first exercise.
            </li>
            <li>
              <strong>Just want to feel the rhythm?</strong> Head straight to{' '}
              <Link to="/rhythm/play-along" onClick={onClose}>Play Along</Link> — no account needed.
            </li>
            <li>
              <strong>Have an account?</strong> Your{' '}
              <Link to="/rhythm/dashboard" onClick={onClose}>Dashboard</Link> shows exactly
              which exercise to try next.
            </li>
          </ul>
        </div>
      </div>

      <div className="welcome-footer">
        <button type="button" className="button-primary" onClick={onClose}>Got it — let's play</button>
      </div>
    </div>
  )
}

function TheoryWelcome({ onClose }: { onClose: () => void }) {
  return (
    <div className="welcome-modal">
      <div className="modal-header">
        <h2 className="modal-title">Welcome to Music Theory</h2>
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
      </div>

      <p className="welcome-intro">
        This section explains <em>why</em> music works — the rules, patterns, and structures that
        composers and musicians use. No prior knowledge needed: start anywhere that catches your curiosity.
      </p>

      <div className="welcome-sections">
        <div className="welcome-section">
          <h3>How it's organised</h3>
          <ul className="welcome-list">
            <li>Topics are grouped into three levels: <strong>Beginner</strong>, <strong>Intermediate</strong>, and <strong>Advanced</strong>.</li>
            <li>Beginner covers the raw materials — notes, intervals, scales, and basic chords.</li>
            <li>Intermediate dives into key relationships, harmonic function, and real-world chord symbols.</li>
            <li>Advanced tackles jazz theory, modulation, counterpoint, and compositional technique.</li>
            <li>You don't have to go in order — feel free to jump to whatever interests you most.</li>
          </ul>
        </div>

        <div className="welcome-section">
          <h3>What's available now</h3>
          <ul className="welcome-list">
            <li>
              <strong>Circle of Fifths</strong> — an interactive diagram of all 12 keys. Click any key
              to explore its signature, relative minor, and all seven diatonic chords.
            </li>
            <li>More lessons are actively being built — check back regularly.</li>
          </ul>
        </div>

        <div className="welcome-section">
          <h3>Where to start</h3>
          <ul className="welcome-list">
            <li>
              <strong>No theory background?</strong> The Beginner tab lists topics in a logical order —
              start with Notes & the Staff when it's available.
            </li>
            <li>
              <strong>Some experience?</strong> Jump straight to the{' '}
              <Link to="/theory/circle-of-fifths" onClick={onClose}>Circle of Fifths</Link> —
              it's interactive, visual, and deeply useful no matter your level.
            </li>
            <li>
              Use the <strong>Dashboard</strong> tab to see what's available and browse by level.
            </li>
          </ul>
        </div>
      </div>

      <div className="welcome-footer">
        <Link to="/theory/circle-of-fifths" className="button-primary" onClick={onClose}>
          Open Circle of Fifths →
        </Link>
      </div>
    </div>
  )
}

// ── NavBar ────────────────────────────────────────────────────────────────────

export function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [mobileSection, setMobileSection] = useState<'rhythm' | 'theory' | null>(null)

  const inRhythm = location.pathname.startsWith('/rhythm')
  const inTheory = location.pathname.startsWith('/theory')

  // Close welcome modal on navigation; do NOT auto-close the mobile menu on navigation
  // so the user can switch sections without it snapping shut.
  useEffect(() => { setShowWelcome(false) }, [location.pathname])

  function handleLogout() {
    logout()
    setToken(null)
    navigate('/')
  }

  // ── Welcome modal (rendered into document.body via portal to escape z-index) ──
  const welcomeModal = showWelcome ? createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) setShowWelcome(false) }}
    >
      <div className="modal-panel welcome-modal-panel">
        {inRhythm && <RhythmWelcome onClose={() => setShowWelcome(false)} />}
        {inTheory && <TheoryWelcome onClose={() => setShowWelcome(false)} />}
        {!inRhythm && !inTheory && (
          // fallback — shouldn't happen since the button only shows in-section
          <div>
            <button type="button" className="modal-close" onClick={() => setShowWelcome(false)}>✕</button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <header className="site-header">
      {welcomeModal}

      {/* ── floating island ── */}
      <div className="navbar">
        <Link to="/" className="navbar-brand">
          <Logo height={34} />
        </Link>

        <nav className="navbar-sections" aria-label="Sections">
          <Link
            to={user ? '/rhythm/dashboard' : '/rhythm/learn'}
            className={`section-pill${inRhythm ? ' section-pill-active section-pill-rhythm' : ''}`}
          >
            Rhythm
          </Link>
          <Link
            to="/theory"
            className={`section-pill${inTheory ? ' section-pill-active section-pill-theory' : ''}`}
          >
            Theory
          </Link>
          <Link to="/about" className="section-pill">About</Link>
        </nav>

        <div className="navbar-user">
          {user ? (
            <>
              <span className="navbar-username">{user.username}</span>
              {user.is_admin && isLocalhost() && (
                <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                  Admin
                </NavLink>
              )}
              <button type="button" className="link-button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="navbar-login-link">Log in</NavLink>
              <NavLink to="/register" className="btn-signup">Sign up</NavLink>
            </>
          )}
        </div>

        <button
          type="button"
          className={`navbar-hamburger${menuOpen ? ' open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => {
            setMenuOpen(o => {
              if (!o) {
                // Opening — auto-expand whichever section the user is already in
                setMobileSection(inRhythm ? 'rhythm' : inTheory ? 'theory' : null)
              }
              return !o
            })
          }}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* ── mobile menu ── */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <nav className="mobile-nav-links">
            {/* Rhythm accordion — tapping the heading expands/collapses; sub-links navigate */}
            <button
              type="button"
              className={`mobile-nav-link mobile-nav-accordion${inRhythm ? ' active' : ''}${mobileSection === 'rhythm' ? ' expanded' : ''}`}
              onClick={() => setMobileSection(s => s === 'rhythm' ? null : 'rhythm')}
            >
              Rhythm
              <span className="mobile-nav-chevron">{mobileSection === 'rhythm' ? '▲' : '▼'}</span>
            </button>
            {mobileSection === 'rhythm' && (
              <div className="mobile-nav-sub">
                {user && <NavLink to="/rhythm/dashboard" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Dashboard</NavLink>}
                {user && <NavLink to="/rhythm/exercises" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Exercises</NavLink>}
                <NavLink to="/rhythm/learn" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Learn</NavLink>
                <NavLink to="/rhythm/play-along" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Play Along</NavLink>
                <button
                  type="button"
                  className="mobile-nav-link sub subnav-welcome-btn"
                  onClick={() => { setMenuOpen(false); setShowWelcome(true) }}
                >
                  Overview & where to start
                </button>
              </div>
            )}

            {/* Theory accordion */}
            <button
              type="button"
              className={`mobile-nav-link mobile-nav-accordion${inTheory ? ' active' : ''}${mobileSection === 'theory' ? ' expanded' : ''}`}
              onClick={() => setMobileSection(s => s === 'theory' ? null : 'theory')}
            >
              Theory
              <span className="mobile-nav-chevron">{mobileSection === 'theory' ? '▲' : '▼'}</span>
            </button>
            {mobileSection === 'theory' && (
              <div className="mobile-nav-sub">
                <NavLink to="/theory" end onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Dashboard</NavLink>
                <NavLink to="/theory/beginner" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Beginner</NavLink>
                <NavLink to="/theory/intermediate" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Intermediate</NavLink>
                <NavLink to="/theory/advanced" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Advanced</NavLink>
                <button
                  type="button"
                  className="mobile-nav-link sub subnav-welcome-btn"
                  onClick={() => { setMenuOpen(false); setShowWelcome(true) }}
                >
                  Overview & where to start
                </button>
              </div>
            )}

            <Link to="/about" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>About</Link>
          </nav>
          <div className="mobile-nav-user">
            {user ? (
              <>
                <span className="navbar-username">{user.username}</span>
                {user.is_admin && isLocalhost() && (
                  <NavLink to="/admin" className="mobile-nav-link">Admin</NavLink>
                )}
                <button type="button" className="link-button" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="navbar-login-link">Log in</NavLink>
                <NavLink to="/register" className="btn-signup">Sign up</NavLink>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── section sub-nav (desktop) ── */}
      {(inRhythm || inTheory) && (
        <nav className="subnav" aria-label="Section navigation">
          <div className="subnav-inner">
            {inRhythm && (
              <>
                {user && (
                  <NavLink to="/rhythm/dashboard" className={({ isActive }) => isActive ? 'subnav-link active' : 'subnav-link'}>
                    Dashboard
                  </NavLink>
                )}
                {user && (
                  <NavLink to="/rhythm/exercises" className={({ isActive }) => isActive ? 'subnav-link active' : 'subnav-link'}>
                    Exercises
                  </NavLink>
                )}
                <NavLink to="/rhythm/learn" className={({ isActive }) => isActive ? 'subnav-link active' : 'subnav-link'}>
                  Learn
                </NavLink>
                <NavLink to="/rhythm/play-along" className={({ isActive }) => isActive ? 'subnav-link active' : 'subnav-link'}>
                  Play Along
                </NavLink>
                <button
                  type="button"
                  className="subnav-welcome-btn"
                  onClick={() => setShowWelcome(true)}
                >
                  ✦ Overview &amp; where to start
                </button>
              </>
            )}
            {inTheory && (
              <>
                <NavLink to="/theory" end className={({ isActive }) => isActive ? 'subnav-link active' : 'subnav-link'}>
                  Dashboard
                </NavLink>
                <NavLink to="/theory/beginner" className={({ isActive }) => isActive ? 'subnav-link active' : 'subnav-link'}>
                  Beginner
                </NavLink>
                <NavLink to="/theory/intermediate" className={({ isActive }) => isActive ? 'subnav-link active' : 'subnav-link'}>
                  Intermediate
                </NavLink>
                <NavLink to="/theory/advanced" className={({ isActive }) => isActive ? 'subnav-link active' : 'subnav-link'}>
                  Advanced
                </NavLink>
                <button
                  type="button"
                  className="subnav-welcome-btn"
                  onClick={() => setShowWelcome(true)}
                >
                  ✦ Overview &amp; where to start
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
