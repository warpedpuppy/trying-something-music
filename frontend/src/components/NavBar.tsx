import { useEffect, useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)

  const inRhythm = location.pathname.startsWith('/rhythm')
  const inTheory = location.pathname.startsWith('/theory')

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  function handleLogout() {
    logout()
    setToken(null)
    navigate('/')
  }

  return (
    <header className="site-header">
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
          onClick={() => setMenuOpen(o => !o)}
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
            <Link
              to={user ? '/rhythm/dashboard' : '/rhythm/learn'}
              className={`mobile-nav-link${inRhythm ? ' active' : ''}`}
            >
              Rhythm
            </Link>
            {inRhythm && (
              <div className="mobile-nav-sub">
                {user && <NavLink to="/rhythm/dashboard" className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Dashboard</NavLink>}
                {user && <NavLink to="/rhythm/exercises" className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Exercises</NavLink>}
                <NavLink to="/rhythm/learn" className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Learn</NavLink>
              </div>
            )}
            <Link
              to="/theory"
              className={`mobile-nav-link${inTheory ? ' active' : ''}`}
            >
              Theory
            </Link>
            {inTheory && (
              <div className="mobile-nav-sub">
                <NavLink to="/theory" end className={({ isActive }) => isActive ? 'mobile-nav-link sub active' : 'mobile-nav-link sub'}>Overview</NavLink>
              </div>
            )}
            <Link to="/about" className="mobile-nav-link">About</Link>
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
