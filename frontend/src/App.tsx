import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './auth/AuthContext'
import { AdminRoute, ProtectedRoute } from './auth/ProtectedRoute'
import { NavBar } from './components/NavBar'
import { RippleCanvas } from './components/RippleCanvas'
import { clearRipples } from './lib/rippleEngine'

// Clears all active ripples whenever the route changes.
// Must live inside <BrowserRouter> to access useLocation.
function RippleClearer() {
  const { pathname } = useLocation()
  useEffect(() => { clearRipples() }, [pathname])
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
import { Register } from './pages/Register'
import { TheoryHome } from './pages/theory/TheoryHome'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global ripple canvas — lowest visible z-index, pointer-events:none */}
        <RippleCanvas />
        <RippleClearer />

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

            {/* theory section */}
            <Route path="/theory" element={<TheoryHome />} />

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
