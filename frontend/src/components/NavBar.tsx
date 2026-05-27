import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { setToken } from '../api/client'
import { Logo } from './Logo'

function isLocalhost(): boolean {
  const { hostname } = window.location
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

export function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const inRhythm = location.pathname.startsWith('/rhythm')
  const inTheory = location.pathname.startsWith('/theory')

  function handleLogout() {
    logout()
    setToken(null)
    navigate('/')
  }

  return (
    <header className="site-header">
      {/* ── top bar ── */}
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
      </div>

      {/* ── section sub-nav ── */}
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
              </>
            )}
            {inTheory && (
              <NavLink to="/theory" end className={({ isActive }) => isActive ? 'subnav-link active' : 'subnav-link'}>
                Overview
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
