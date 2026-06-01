import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './auth/AuthContext'
import { AdminRoute, ProtectedRoute } from './auth/ProtectedRoute'
import { NavBar } from './components/NavBar'
import { RippleCanvas } from './components/RippleCanvas'
import { clearRipples } from './lib/rippleEngine'
import { ComingSoon } from './pages/ComingSoon'

// Evaluated once at module load — stable for the entire session.
const IS_TESTING = new URLSearchParams(window.location.search).has('testing')

// Clears all active ripples whenever the route changes.
// Must live inside <BrowserRouter> to access useLocation.
function RippleClearer() {
  const { pathname } = useLocation()
  useEffect(() => { clearRipples() }, [pathname])
  return null
}

// Keeps ?testing=true in the URL after every internal navigation.
// React Router's <Link> strips query params by default, so we
// re-add the param via replace-navigation after each route change.
function TestingParamPreserver() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (!params.has('testing')) {
      params.set('testing', 'true')
      navigate(
        { pathname: location.pathname, search: '?' + params.toString(), hash: location.hash },
        { replace: true },
      )
    }
  // Run whenever any part of the location changes; the guard prevents loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.hash])

  return null
}
import { About } from './pages/About'
import { Admin } from './pages/admin/Admin'
import { Dashboard } from './pages/Dashboard'
import { ExerciseList } from './pages/ExerciseList'
import { ExercisePlayer } from './pages/ExercisePlayer'
import { SheetMusicGame } from './pages/SheetMusicGame'
import { Home } from './pages/Home'
import { Learn } from './pages/Learn'
import { Login } from './pages/Login'
import { PlayAlong } from './pages/PlayAlong'
import { Register } from './pages/Register'
import { TheoryHome, TheoryLevelPage } from './pages/theory/TheoryHome'
import { CircleOfFifths } from './pages/theory/CircleOfFifths'
import { NotesAndStaff } from './pages/theory/NotesAndStaff'
import { KeySignatures } from './pages/theory/KeySignatures'
import { IntervalsPage } from './pages/theory/Intervals'
import { ScalesAndMajorScale } from './pages/theory/ScalesPage'
import { TriadsAndChords } from './pages/theory/Chords'
import { Cadences } from './pages/theory/Cadences'
import { ChordProgressions } from './pages/theory/Progressions'
import { DiatonicHarmony } from './pages/theory/DiatonicHarmony'
import { VoiceLeading } from './pages/theory/VoiceLeading'
import { SecondaryDominants } from './pages/theory/SecondaryDominants'
import { ModalMixture } from './pages/theory/ModalMixture'
import { Blues } from './pages/theory/Blues'
import { ChordSymbols } from './pages/theory/ChordSymbols'
import { Modulation } from './pages/theory/Modulation'
import { ModesPage } from './pages/theory/Modes'
import { ExtendedChords } from './pages/theory/ExtendedChords'
import { TritoneSubstitution } from './pages/theory/TritoneSubstitution'
import { Counterpoint } from './pages/theory/Counterpoint'
import { FormAndStructure } from './pages/theory/FormAndStructure'
import { Reharmonization } from './pages/theory/Reharmonization'
import './App.css'

function App() {
  // ── Testing gate — show landing page unless ?testing=true is present ──────
  // ComingSoon uses <Link>, so it must be rendered inside a Router or it throws
  // (a Router-less <Link> crashes at runtime → blank page).
  if (!IS_TESTING) {
    return (
      <BrowserRouter>
        <ComingSoon />
      </BrowserRouter>
    )
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global ripple canvas — lowest visible z-index, pointer-events:none */}
        <RippleCanvas />
        <RippleClearer />
        {/* Keep ?testing=true in the URL after every navigation */}
        <TestingParamPreserver />

        <NavBar />
        <main className="page">
          <Routes>
            {/* public */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* rhythm section */}
            <Route path="/rhythm/learn" element={<Learn />} />
            <Route path="/rhythm/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/rhythm/exercises" element={<ProtectedRoute><ExerciseList /></ProtectedRoute>} />
            <Route path="/rhythm/exercises/:id" element={<ProtectedRoute><ExercisePlayer /></ProtectedRoute>} />
            <Route path="/rhythm/game" element={<ProtectedRoute><SheetMusicGame /></ProtectedRoute>} />
            <Route path="/rhythm/play-along" element={<PlayAlong />} />

            {/* theory section */}
            <Route path="/theory" element={<TheoryHome />} />
            <Route path="/theory/beginner"     element={<TheoryLevelPage levelName="Beginner" />} />
            <Route path="/theory/intermediate" element={<TheoryLevelPage levelName="Intermediate" />} />
            <Route path="/theory/advanced"     element={<TheoryLevelPage levelName="Advanced" />} />
            <Route path="/theory/circle-of-fifths" element={<CircleOfFifths />} />
            <Route path="/theory/notes"        element={<NotesAndStaff />} />
            <Route path="/theory/keys"         element={<KeySignatures />} />
            <Route path="/theory/intervals"    element={<IntervalsPage />} />
            <Route path="/theory/scales"       element={<ScalesAndMajorScale />} />
            <Route path="/theory/chords"       element={<TriadsAndChords />} />
            <Route path="/theory/cadences"     element={<Cadences />} />
            <Route path="/theory/progressions" element={<ChordProgressions />} />
            <Route path="/theory/diatonic-harmony"     element={<DiatonicHarmony />} />
            <Route path="/theory/voice-leading"        element={<VoiceLeading />} />
            <Route path="/theory/secondary-dominants"  element={<SecondaryDominants />} />
            <Route path="/theory/modal-mixture"        element={<ModalMixture />} />
            <Route path="/theory/blues"                element={<Blues />} />
            <Route path="/theory/chord-symbols"        element={<ChordSymbols />} />
            <Route path="/theory/modulation"           element={<Modulation />} />
            <Route path="/theory/modes"                element={<ModesPage />} />
            <Route path="/theory/extended-chords"      element={<ExtendedChords />} />
            <Route path="/theory/tritone-sub"          element={<TritoneSubstitution />} />
            <Route path="/theory/counterpoint"         element={<Counterpoint />} />
            <Route path="/theory/form"                 element={<FormAndStructure />} />
            <Route path="/theory/reharmonization"      element={<Reharmonization />} />

            {/* admin */}
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

            {/* legacy redirects */}
            <Route path="/dashboard" element={<Navigate to="/rhythm/dashboard" replace />} />
            <Route path="/exercises" element={<Navigate to="/rhythm/exercises" replace />} />
            <Route path="/learn" element={<Navigate to="/rhythm/learn" replace />} />
          </Routes>
        </main>

        <footer className="site-footer">
          <span>© {new Date().getFullYear()} trying something · all data stored locally in your browser</span>
        </footer>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
