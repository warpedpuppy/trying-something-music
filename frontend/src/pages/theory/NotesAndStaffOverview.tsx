/**
 * NotesAndStaffOverview — animated grand staff for the Notes & the Staff overview tab.
 *
 * Shows a piano grand staff (bass clef + treble clef). An animated note head
 * travels from G2 (bass bottom line) up to F5 (treble top line) and back,
 * continuously, with each pitch rendered in a rainbow color. The corresponding
 * pitch plays softly via the theory audio engine.
 */

import { useEffect, useState } from 'react'
import { theoryAudio } from '../../lib/theoryAudio'

// ── Staff geometry (SVG viewBox: "0 0 520 205") ──────────────────────────────
//
// Line spacing = 12px.  Y increases downward.
//
// Treble lines (bottom → top): E4=98, G4=86, B4=74, D5=62, F5=50
// Bass   lines (bottom → top): G2=170, B2=158, D3=146, F3=134, A3=122
// Middle C (C4) ledger line: y=110  (between A3=122 and E4=98)

const TREBLE_LINES = [50, 62, 74, 86, 98]   // F5, D5, B4, G4, E4
const BASS_LINES   = [122, 134, 146, 158, 170] // A3, F3, D3, B2, G2

interface StaffNote {
  name: string
  midi: number
  y: number      // SVG y coordinate of note center
}

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
  { name: 'C4', midi: 60, y: 110 }, // middle C — ledger line
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

// Up (G2→F5) then down (E5→A2), so G2 and F5 each appear once per cycle.
const SEQUENCE: number[] = [
  ...Array.from({ length: N }, (_, i) => i),                    // 0..20
  ...Array.from({ length: N - 2 }, (_, i) => N - 2 - i),       // 19..1
]

// Rainbow: red (G2) → orange → yellow → green → blue → violet (F5)
const RAINBOW = Array.from({ length: N }, (_, i) =>
  `hsl(${Math.round(i * 270 / (N - 1))}, 85%, 60%)`
)

const NOTE_X     = 262   // horizontal center of note head
const LEDGER_PAD = 12    // half-width of ledger line
const TRAIL_LEN  = 5     // how many ghost notes to show
const STEP_MS    = 680   // ms between notes
const NOTE_DUR   = 0.55  // seconds each note rings

// ── Component ────────────────────────────────────────────────────────────────

export function NotesAndStaffOverview() {
  const [step, setStep]       = useState(0)
  const [history, setHistory] = useState<number[]>([SEQUENCE[0]])
  const [isPlaying, setIsPlaying] = useState(true)

  // Advance through notes
  useEffect(() => {
    if (!isPlaying) return
    const ni = SEQUENCE[step]
    try { theoryAudio.playNote(NOTES[ni].midi, NOTE_DUR) } catch { /* autoplay may be blocked */ }
    setHistory(prev => [...prev.slice(-(TRAIL_LEN)), ni])
    const t = window.setTimeout(() => setStep(s => (s + 1) % SEQUENCE.length), STEP_MS)
    return () => clearTimeout(t)
  }, [step, isPlaying])

  const currentNi = history[history.length - 1] ?? 0
  const currentNote = NOTES[currentNi]
  const currentColor = RAINBOW[currentNi]
  const trail = history.slice(0, -1)  // previous notes (oldest first)

  // Show ledger line for C4 whenever it's current or recently played
  const showLedger = history.includes(10)

  // Stem direction: below C4 → stem up; at/above C4 → stem down
  const stemUp = currentNi < 10
  const stemX  = stemUp ? NOTE_X + 8 : NOTE_X - 8
  const stemY1 = currentNote.y
  const stemY2 = stemUp ? currentNote.y - 32 : currentNote.y + 32

  return (
    <div className="ns-overview">
      <p className="ns-overview-title">The Grand Staff</p>
      <p className="ns-overview-subtitle">G2 → F5 · bass &amp; treble clef</p>

      <div className="ns-staff-wrap">
        <svg
          viewBox="0 0 520 205"
          width="100%"
          style={{ maxWidth: 580, display: 'block', margin: '0 auto' }}
          aria-label="Animated piano grand staff — notes ascending from G2 to F5 then descending"
        >
          {/* ── Staff lines ─────────────────────────────────── */}
          {TREBLE_LINES.map(y => (
            <line key={`tl${y}`} x1={68} y1={y} x2={500} y2={y}
              stroke="currentColor" strokeWidth={1.2} className="ns-staff-line" />
          ))}
          {BASS_LINES.map(y => (
            <line key={`bl${y}`} x1={68} y1={y} x2={500} y2={y}
              stroke="currentColor" strokeWidth={1.2} className="ns-staff-line" />
          ))}

          {/* ── Left barline connecting both staves ─────────── */}
          <line x1={68} y1={50} x2={68} y2={170}
            stroke="currentColor" strokeWidth={2} className="ns-staff-line" />

          {/* ── Treble clef ─────────────────────────────────── */}
          <text x={6} y={107} fontSize={70} fontFamily="serif" className="ns-clef">𝄞</text>

          {/* ── Bass clef ───────────────────────────────────── */}
          <text x={10} y={152} fontSize={32} fontFamily="serif" className="ns-clef">𝄢</text>

          {/* ── Middle C ledger line ────────────────────────── */}
          {showLedger && (
            <line
              x1={NOTE_X - LEDGER_PAD} y1={110}
              x2={NOTE_X + LEDGER_PAD} y2={110}
              stroke="currentColor" strokeWidth={1.2} className="ns-staff-line"
            />
          )}

          {/* ── Trail ghost notes (oldest = most faded) ─────── */}
          {trail.map((ni, ti) => {
            const n = NOTES[ni]
            const opacity = ((ti + 1) / TRAIL_LEN) * 0.38
            return (
              <ellipse
                key={`tr${ti}`}
                cx={NOTE_X} cy={n.y} rx={8} ry={6}
                fill={RAINBOW[ni]} opacity={opacity}
              />
            )
          })}

          {/* ── Current note glow (soft halo) ───────────────── */}
          <ellipse cx={NOTE_X} cy={currentNote.y} rx={16} ry={13}
            fill={currentColor} opacity={0.18} />

          {/* ── Current note stem ───────────────────────────── */}
          <line x1={stemX} y1={stemY1} x2={stemX} y2={stemY2}
            stroke={currentColor} strokeWidth={1.6} />

          {/* ── Current note head ───────────────────────────── */}
          <ellipse cx={NOTE_X} cy={currentNote.y} rx={9} ry={7}
            fill={currentColor} />

          {/* ── Note name label ─────────────────────────────── */}
          <text
            x={NOTE_X} y={193}
            textAnchor="middle" fontSize={14} fontWeight="700"
            fill={currentColor} fontFamily="system-ui, sans-serif"
          >
            {currentNote.name}
          </text>
        </svg>
      </div>

      {/* Play / Pause button */}
      <div className="ns-overview-controls">
        <button
          type="button"
          className="ns-play-btn"
          onClick={() => setIsPlaying(p => !p)}
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>
    </div>
  )
}
