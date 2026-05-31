/**
 * NotesAndStaffOverview — animated grand staff for the Notes & the Staff overview tab.
 *
 * Shows a piano grand staff (bass + treble clef). A rainbow-coloured note head
 * travels G2 → F5 → G2 continuously. Animation runs always; audio is OFF by
 * default and toggled with "♪ Listen to notes". All audio stops when the user
 * leaves the tab (visibilitychange).
 */

import { useCallback, useEffect, useState } from 'react'
import { theoryAudio } from '../../lib/theoryAudio'

// ── Staff geometry (SVG viewBox "0 0 520 205") ────────────────────────────────
//
// Line spacing = 12 px.  Y increases downward.
// Staff lines begin at x = 8 so the clef symbols sit ON the lines (real notation style).
//
// Treble lines (low→high):  E4=98  G4=86  B4=74  D5=62  F5=50
// Bass   lines (low→high):  G2=170 B2=158 D3=146 F3=134 A3=122
// Middle C ledger line:      y = 110  (between A3 and E4)

const STAFF_X1     = 8     // staff lines start here (clef lives on the lines)
const STAFF_X2     = 510
const NOTE_X       = 280   // horizontal centre of animated note head
const LEDGER_HALF  = 13    // half-width of ledger line (wider than note rx so it shows)

const TREBLE_LINES = [50, 62, 74, 86, 98]    // F5 D5 B4 G4 E4
const BASS_LINES   = [122, 134, 146, 158, 170] // A3 F3 D3 B2 G2

interface StaffNote { name: string; midi: number; y: number }

const NOTES: StaffNote[] = [
  { name: 'G2', midi: 43, y: 170 },
  { name: 'A2', midi: 45, y: 164 },
  { name: 'B2', midi: 47, y: 158 },
  { name: 'C3', midi: 48, y: 152 },
  { name: 'D3', midi: 50, y: 146 },
  { name: 'E3', midi: 52, y: 140 },
  { name: 'F3', midi: 53, y: 134 },
  { name: 'G3', midi: 55, y: 128 },
  { name: 'A3', midi: 57, y: 122 },
  { name: 'B3', midi: 59, y: 116 },
  { name: 'C4', midi: 60, y: 110 }, // middle C — needs ledger line
  { name: 'D4', midi: 62, y: 104 },
  { name: 'E4', midi: 64, y:  98 },
  { name: 'F4', midi: 65, y:  92 },
  { name: 'G4', midi: 67, y:  86 },
  { name: 'A4', midi: 69, y:  80 },
  { name: 'B4', midi: 71, y:  74 },
  { name: 'C5', midi: 72, y:  68 },
  { name: 'D5', midi: 74, y:  62 },
  { name: 'E5', midi: 76, y:  56 },
  { name: 'F5', midi: 77, y:  50 },
]

const N = NOTES.length  // 21
const C4_IDX = 10       // index of middle C in NOTES

// Up G2→F5, then down E5→A2 (G2/F5 each appear once per cycle)
const SEQUENCE: number[] = [
  ...Array.from({ length: N },     (_, i) => i),           // 0..20
  ...Array.from({ length: N - 2 }, (_, i) => N - 2 - i),  // 19..1
]

// Rainbow: red (G2) → violet (F5)
const RAINBOW = Array.from({ length: N }, (_, i) =>
  `hsl(${Math.round(i * 270 / (N - 1))}, 85%, 60%)`
)

const TRAIL_LEN = 5
const STEP_MS   = 680
const NOTE_DUR  = 0.55

// ── Component ─────────────────────────────────────────────────────────────────

export function NotesAndStaffOverview() {
  const [step,      setStep]      = useState(0)
  const [history,   setHistory]   = useState<number[]>([SEQUENCE[0]])
  const [isAudioOn, setIsAudioOn] = useState(false)

  // Stop audio when user leaves the tab
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        theoryAudio.stop()
        setIsAudioOn(false)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Advance animation each step (always runs; audio only when isAudioOn)
  useEffect(() => {
    const ni = SEQUENCE[step]
    if (isAudioOn) {
      try { theoryAudio.playNote(NOTES[ni].midi, NOTE_DUR) } catch { /* autoplay blocked */ }
    }
    setHistory(prev => [...prev.slice(-TRAIL_LEN), ni])
    const t = window.setTimeout(() => setStep(s => (s + 1) % SEQUENCE.length), STEP_MS)
    return () => clearTimeout(t)
  }, [step, isAudioOn])

  // When audio is toggled off, silence whatever is playing
  const toggleAudio = useCallback(() => {
    setIsAudioOn(on => {
      if (on) theoryAudio.stop()
      return !on
    })
  }, [])

  const currentNi    = history[history.length - 1] ?? 0
  const currentNote  = NOTES[currentNi]
  const currentColor = RAINBOW[currentNi]
  const trail        = history.slice(0, -1)  // oldest…penultimate

  // Ledger line: show whenever middle C is current or in recent trail
  const showLedger = currentNi === C4_IDX || trail.includes(C4_IDX)

  // Stem: below middle C → stem up (right side); at/above → stem down (left side)
  const stemUp = currentNi < C4_IDX
  const stemX  = stemUp ? NOTE_X + 8 : NOTE_X - 8
  const stemY2 = stemUp ? currentNote.y - 32 : currentNote.y + 32

  return (
    <div className="ns-overview">
      <p className="ns-overview-title">The Grand Staff</p>
      <p className="ns-overview-subtitle">G2 → F5 · bass &amp; treble clef · piano range</p>

      <div className="ns-staff-wrap">
        <svg
          viewBox="0 0 520 205"
          width="100%"
          style={{ maxWidth: 580, display: 'block', margin: '0 auto' }}
          aria-label="Animated piano grand staff — rainbow notes from G2 to F5"
        >
          {/* ── Staff lines (start at STAFF_X1 so clefs sit ON the lines) ── */}
          {TREBLE_LINES.map(y => (
            <line key={`tl${y}`} x1={STAFF_X1} y1={y} x2={STAFF_X2} y2={y}
              stroke="currentColor" strokeWidth={1.2} className="ns-staff-line" />
          ))}
          {BASS_LINES.map(y => (
            <line key={`bl${y}`} x1={STAFF_X1} y1={y} x2={STAFF_X2} y2={y}
              stroke="currentColor" strokeWidth={1.2} className="ns-staff-line" />
          ))}

          {/* ── Left barline connecting both staves ── */}
          <line x1={STAFF_X1} y1={50} x2={STAFF_X1} y2={170}
            stroke="currentColor" strokeWidth={2} className="ns-staff-line" />

          {/* ── Treble clef (sits on the staff lines) ── */}
          <text x={9} y={107} fontSize={70} fontFamily="serif" className="ns-clef">𝄞</text>

          {/* ── Bass clef (sits on the staff lines) ── */}
          <text x={12} y={152} fontSize={32} fontFamily="serif" className="ns-clef">𝄢</text>

          {/* ── Trail ghost notes (oldest = most faded) ── */}
          {trail.map((ni, ti) => (
            <ellipse
              key={`tr${ti}`}
              cx={NOTE_X} cy={NOTES[ni].y} rx={8} ry={6}
              fill={RAINBOW[ni]} opacity={((ti + 1) / TRAIL_LEN) * 0.35}
            />
          ))}

          {/* ── Glow halo around current note ── */}
          <ellipse cx={NOTE_X} cy={currentNote.y} rx={16} ry={13}
            fill={currentColor} opacity={0.18} />

          {/* ── Stem ── */}
          <line x1={stemX} y1={currentNote.y} x2={stemX} y2={stemY2}
            stroke={currentColor} strokeWidth={1.6} />

          {/* ── Note head ── */}
          <ellipse cx={NOTE_X} cy={currentNote.y} rx={9} ry={7}
            fill={currentColor} />

          {/* ── Middle C ledger line — drawn AFTER note head so it shows through ── */}
          {showLedger && (
            <line
              x1={NOTE_X - LEDGER_HALF} y1={110}
              x2={NOTE_X + LEDGER_HALF} y2={110}
              stroke="currentColor" strokeWidth={1.5} className="ns-staff-line"
            />
          )}

          {/* ── Note name label ── */}
          <text
            x={NOTE_X} y={195}
            textAnchor="middle" fontSize={14} fontWeight="700"
            fill={currentColor} fontFamily="system-ui, sans-serif"
          >
            {currentNote.name}
          </text>
        </svg>
      </div>

      <div className="ns-overview-controls">
        <button
          type="button"
          className={`ns-play-btn${isAudioOn ? ' active' : ''}`}
          onClick={toggleAudio}
          aria-pressed={isAudioOn}
        >
          {isAudioOn ? '♫ Stop listening' : '♪ Listen to notes'}
        </button>
      </div>
    </div>
  )
}
