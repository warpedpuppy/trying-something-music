import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { NavBar } from './components/NavBar'
import { RippleCanvas } from './components/RippleCanvas'
import { clearRipples } from './lib/rippleEngine'
import { recordTheoryVisit } from './lib/localDb'
import { SHOW_THEORY } from './lib/featureFlags'
import { About } from './pages/About'
import { Dashboard } from './pages/Dashboard'
import { ExerciseList } from './pages/ExerciseList'
import { ExercisePlayer } from './pages/ExercisePlayer'
import { Home } from './pages/Home'
import { Learn } from './pages/Learn'
import { Login } from './pages/Login'
import { PlayAlong } from './pages/PlayAlong'
import { Register } from './pages/Register'
import { UserProfile } from './pages/UserProfile'
import './App.css'

const TheoryHome = lazy(() => import('./pages/theory/TheoryHome').then(m => ({ default: m.TheoryHome })))
const TheoryLevelPage = lazy(() => import('./pages/theory/TheoryHome').then(m => ({ default: m.TheoryLevelPage })))
const TheoryPractice = lazy(() => import('./pages/theory/TheoryPractice').then(m => ({ default: m.TheoryPractice })))
const CircleOfFifths = lazy(() => import('./pages/theory/CircleOfFifths').then(m => ({ default: m.CircleOfFifths })))
const NotesAndStaff = lazy(() => import('./pages/theory/NotesAndStaff').then(m => ({ default: m.NotesAndStaff })))
const KeySignatures = lazy(() => import('./pages/theory/KeySignatures').then(m => ({ default: m.KeySignatures })))
const IntervalsPage = lazy(() => import('./pages/theory/Intervals').then(m => ({ default: m.IntervalsPage })))
const ScalesAndMajorScale = lazy(() => import('./pages/theory/ScalesPage').then(m => ({ default: m.ScalesAndMajorScale })))
const TriadsAndChords = lazy(() => import('./pages/theory/Chords').then(m => ({ default: m.TriadsAndChords })))
const Cadences = lazy(() => import('./pages/theory/Cadences').then(m => ({ default: m.Cadences })))
const ChordProgressions = lazy(() => import('./pages/theory/Progressions').then(m => ({ default: m.ChordProgressions })))
const DiatonicHarmony = lazy(() => import('./pages/theory/DiatonicHarmony').then(m => ({ default: m.DiatonicHarmony })))
const VoiceLeading = lazy(() => import('./pages/theory/VoiceLeading').then(m => ({ default: m.VoiceLeading })))
const SecondaryDominants = lazy(() => import('./pages/theory/SecondaryDominants').then(m => ({ default: m.SecondaryDominants })))
const ModalMixture = lazy(() => import('./pages/theory/ModalMixture').then(m => ({ default: m.ModalMixture })))
const Blues = lazy(() => import('./pages/theory/Blues').then(m => ({ default: m.Blues })))
const ChordSymbols = lazy(() => import('./pages/theory/ChordSymbols').then(m => ({ default: m.ChordSymbols })))
const Modulation = lazy(() => import('./pages/theory/Modulation').then(m => ({ default: m.Modulation })))
const ModesPage = lazy(() => import('./pages/theory/Modes').then(m => ({ default: m.ModesPage })))
const ExtendedChords = lazy(() => import('./pages/theory/ExtendedChords').then(m => ({ default: m.ExtendedChords })))
const TritoneSubstitution = lazy(() => import('./pages/theory/TritoneSubstitution').then(m => ({ default: m.TritoneSubstitution })))
const Counterpoint = lazy(() => import('./pages/theory/Counterpoint').then(m => ({ default: m.Counterpoint })))
const FormAndStructure = lazy(() => import('./pages/theory/FormAndStructure').then(m => ({ default: m.FormAndStructure })))
const Reharmonization = lazy(() => import('./pages/theory/Reharmonization').then(m => ({ default: m.Reharmonization })))

function RippleClearer() {
  const { pathname } = useLocation()
  useEffect(() => { clearRipples() }, [pathname])
  return null
}

// Keeps ?theory=true in the URL after every internal navigation.
// React Router's <Link> strips query params by default.
function DevFlagPreserver() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (SHOW_THEORY && !params.has('theory')) {
      params.set('theory', 'true')
      navigate(
        { pathname: location.pathname, search: '?' + params.toString(), hash: location.hash },
        { replace: true },
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.hash])

  return null
}

function TheoryTracker() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  useEffect(() => {
    if (!user) return
    const slug = pathname.replace(/^\/theory\/?/, '')
    if (slug) recordTheoryVisit(user.id, slug)
  }, [pathname, user])
  return <Outlet />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RippleCanvas />
        <RippleClearer />
        {SHOW_THEORY && <DevFlagPreserver />}

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
            <Route path="/rhythm/play-along" element={<PlayAlong />} />

            {/* theory section — only when ?theory=true flag is set */}
            {SHOW_THEORY && (
              <Route path="/theory" element={<Suspense fallback={null}><TheoryTracker /></Suspense>}>
                <Route index                      element={<TheoryHome />} />
                <Route path="beginner"            element={<TheoryLevelPage levelName="Beginner" />} />
                <Route path="intermediate"        element={<TheoryLevelPage levelName="Intermediate" />} />
                <Route path="advanced"            element={<TheoryLevelPage levelName="Advanced" />} />
                <Route path="practice"            element={<TheoryPractice />} />
                <Route path="circle-of-fifths"    element={<CircleOfFifths />} />
                <Route path="notes"               element={<NotesAndStaff />} />
                <Route path="keys"                element={<KeySignatures />} />
                <Route path="intervals"           element={<IntervalsPage />} />
                <Route path="scales"              element={<ScalesAndMajorScale />} />
                <Route path="chords"              element={<TriadsAndChords />} />
                <Route path="cadences"            element={<Cadences />} />
                <Route path="progressions"        element={<ChordProgressions />} />
                <Route path="diatonic-harmony"    element={<DiatonicHarmony />} />
                <Route path="voice-leading"       element={<VoiceLeading />} />
                <Route path="secondary-dominants" element={<SecondaryDominants />} />
                <Route path="modal-mixture"       element={<ModalMixture />} />
                <Route path="blues"               element={<Blues />} />
                <Route path="chord-symbols"       element={<ChordSymbols />} />
                <Route path="modulation"          element={<Modulation />} />
                <Route path="modes"               element={<ModesPage />} />
                <Route path="extended-chords"     element={<ExtendedChords />} />
                <Route path="tritone-sub"         element={<TritoneSubstitution />} />
                <Route path="counterpoint"        element={<Counterpoint />} />
                <Route path="form"                element={<FormAndStructure />} />
                <Route path="reharmonization"     element={<Reharmonization />} />
              </Route>
            )}

            {/* user profile */}
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

            {/* legacy redirects */}
            <Route path="/dashboard" element={<Navigate to="/rhythm/dashboard" replace />} />
            <Route path="/exercises" element={<Navigate to="/rhythm/exercises" replace />} />
            <Route path="/learn" element={<Navigate to="/rhythm/learn" replace />} />
          </Routes>
        </main>

        <footer className="site-footer">
          <span>© {new Date().getFullYear()} <a href="https://warpedpuppy.com" target="_blank" rel="noopener noreferrer">Warped Puppy LLC</a> · trying something · practice data stored locally in your browser</span>
        </footer>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
