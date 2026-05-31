/**
 * NotesAndStaffOverview — animated grand staff for the Notes & the Staff overview tab.
 *
 * Displays a 4/4 grand staff with 16 sixteenth notes (E4→E5→D4, all in the treble
 * range for clean beaming). All notes are drawn black and persist on the staff.
 * As each note plays, it lights up in its rainbow colour and emits a ripple.
 * The measure loops continuously. Audio is OFF by default; toggle with the button.
 * All audio stops when the user leaves the tab.
 */

import { useCallback, useEffect, useState } from 'react'
import { theoryAudio } from '../../lib/theoryAudio'

// ── Staff geometry ────────────────────────────────────────────────────────────
// SVG viewBox "0 0 530 210". Line spacing = 12 px. Y increases downward.
// Treble lines: E4=98, G4=86, B4=74, D5=62, F5=50
// Bass   lines: G2=170, B2=158, D3=146, F3=134, A3=122
// Clef + time-sig area: x 0–92. Notes: x 95–482. Right barline: x 490.

const STAFF_X1 = 8    // staff lines start here (clef sits ON the lines)
const STAFF_X2 = 490  // right barline x

const TREBLE_LINES = [50, 62, 74, 86, 98]
const BASS_LINES   = [122, 134, 146, 158, 170]

// ── All 21 pitches (for colour lookup) ───────────────────────────────────────
interface StaffNote { name: string; midi: number; y: number }

const ALL_NOTES: StaffNote[] = [
  { name: 'G2', midi: 43, y: 170 }, { name: 'A2', midi: 45, y: 164 },
  { name: 'B2', midi: 47, y: 158 }, { name: 'C3', midi: 48, y: 152 },
  { name: 'D3', midi: 50, y: 146 }, { name: 'E3', midi: 52, y: 140 },
  { name: 'F3', midi: 53, y: 134 }, { name: 'G3', midi: 55, y: 128 },
  { name: 'A3', midi: 57, y: 122 }, { name: 'B3', midi: 59, y: 116 },
  { name: 'C4', midi: 60, y: 110 }, { name: 'D4', midi: 62, y: 104 },
  { name: 'E4', midi: 64, y:  98 }, { name: 'F4', midi: 65, y:  92 },
  { name: 'G4', midi: 67, y:  86 }, { name: 'A4', midi: 69, y:  80 },
  { name: 'B4', midi: 71, y:  74 }, { name: 'C5', midi: 72, y:  68 },
  { name: 'D5', midi: 74, y:  62 }, { name: 'E5', midi: 76, y:  56 },
  { name: 'F5', midi: 77, y:  50 },
]

// Rainbow across the full pitch range (index into ALL_NOTES → colour)
const ALL_RAINBOW = Array.from({ length: ALL_NOTES.length }, (_, i) =>
  `hsl(${Math.round(i * 270 / (ALL_NOTES.length - 1))}, 85%, 58%)`
)

// ── 16-note measure (one beat = 4 sixteenth notes) ───────────────────────────
// All in the treble range so beaming is clean. Ascending E4→E5, descending D5→D4.
// Indices into ALL_NOTES:
//   12=E4  13=F4  14=G4  15=A4  16=B4  17=C5  18=D5  19=E5
//   18=D5  17=C5  16=B4  15=A4  14=G4  13=F4  12=E4  11=D4

const MEASURE_IDX = [12,13,14,15, 16,17,18,19, 18,17,16,15, 14,13,12,11] as const
const NOTE_COUNT  = 16

// X positions: 16 notes evenly spaced from x=95 to x=482 (spacing ≈ 25.8 px)
const NOTE_START = 95
const NOTE_SPACE = 25
const noteXs = Array.from({ length: NOTE_COUNT }, (_, i) => NOTE_START + i * NOTE_SPACE)

// ── Beaming (groups of 4; all stems go DOWN since notes are in treble) ────────
// Beam y = lowest note in group y + 28 (primary); secondary 6 px above primary.
const GROUPS = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15]] as const
const BEAM_DROP = 28  // px below lowest note → primary beam y
const BEAM_GAP  = 6   // gap between the two beams

const beams = GROUPS.map(group => {
  const maxY = Math.max(...group.map(i => ALL_NOTES[MEASURE_IDX[i]].y))
  return {
    y1: maxY + BEAM_DROP,
    y2: maxY + BEAM_DROP - BEAM_GAP,
    x1: noteXs[group[0]],
    x2: noteXs[group[group.length - 1]],
  }
})

// ── Timing ───────────────────────────────────────────────────────────────────
const STEP_MS  = 280   // ms per sixteenth note (≈ 54 BPM quarter — gently slow)
const NOTE_DUR = 0.30  // seconds each note rings

// ── Ripple key helper (force remount per step) ────────────────────────────────
// The <circle key={rippleKey}> remounts on each step, restarting the CSS animation.

// ── Component ─────────────────────────────────────────────────────────────────

export function NotesAndStaffOverview() {
  const [step,      setStep]      = useState(0)
  const [history,   setHistory]   = useState<number[]>([])   // recent step indices
  const [isAudioOn, setIsAudioOn] = useState(false)

  // Stop audio when user leaves the tab
  useEffect(() => {
    const onVis = () => { if (document.hidden) { theoryAudio.stop(); setIsAudioOn(false) } }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Advance each step — animation always runs; audio only when enabled
  useEffect(() => {
    const ni = MEASURE_IDX[step]
    if (isAudioOn) {
      try { theoryAudio.playNote(ALL_NOTES[ni].midi, NOTE_DUR) } catch { /* blocked */ }
    }
    setHistory(prev => [...prev.slice(-5), step])
    const t = window.setTimeout(() => setStep(s => (s + 1) % NOTE_COUNT), STEP_MS)
    return () => clearTimeout(t)
  }, [step, isAudioOn])

  // Toggle audio; silence immediately on turn-off
  const toggleAudio = useCallback(() => {
    setIsAudioOn(on => { if (on) theoryAudio.stop(); return !on })
  }, [])

  const currentStep  = history[history.length - 1] ?? 0
  const currentNi    = MEASURE_IDX[currentStep]
  const currentNote  = ALL_NOTES[currentNi]
  const currentColor = ALL_RAINBOW[currentNi]
  const trail        = history.slice(0, -1)

  return (
    <div className="ns-overview">
      <p className="ns-overview-title">The Grand Staff</p>
      <p className="ns-overview-subtitle">4/4 · sixteen notes · treble &amp; bass clef</p>

      <div className="ns-staff-wrap">
        <svg
          viewBox="0 0 530 210"
          width="100%"
          style={{ maxWidth: 600, display: 'block', margin: '0 auto' }}
          aria-label="Animated grand staff — 16 sixteenth notes ascending and descending"
        >
          {/* ── Staff lines (start at STAFF_X1 so clefs sit ON the lines) ─── */}
          {TREBLE_LINES.map(y => (
            <line key={`tl${y}`} x1={STAFF_X1} y1={y} x2={STAFF_X2} y2={y}
              stroke="currentColor" strokeWidth={1.2} className="ns-staff-line" />
          ))}
          {BASS_LINES.map(y => (
            <line key={`bl${y}`} x1={STAFF_X1} y1={y} x2={STAFF_X2} y2={y}
              stroke="currentColor" strokeWidth={1.2} className="ns-staff-line" />
          ))}

          {/* ── Left barline (spans both staves) ────────────────────────── */}
          <line x1={STAFF_X1} y1={50} x2={STAFF_X1} y2={170}
            stroke="currentColor" strokeWidth={2} className="ns-staff-line" />

          {/* ── Right barline ────────────────────────────────────────────── */}
          <line x1={STAFF_X2} y1={50} x2={STAFF_X2} y2={170}
            stroke="currentColor" strokeWidth={2} className="ns-staff-line" />

          {/* ── Treble clef (ON the staff lines) ─────────────────────────── */}
          <text x={9} y={107} fontSize={70} fontFamily="serif" className="ns-clef">𝄞</text>

          {/* ── Bass clef (ON the staff lines) ───────────────────────────── */}
          <text x={12} y={152} fontSize={32} fontFamily="serif" className="ns-clef">𝄢</text>

          {/* ── Time signature 4/4 (treble staff) ───────────────────────── */}
          <text x={75} y={62} fontSize={20} fontWeight="bold" textAnchor="middle"
            dominantBaseline="central" className="ns-clef">4</text>
          <text x={75} y={86} fontSize={20} fontWeight="bold" textAnchor="middle"
            dominantBaseline="central" className="ns-clef">4</text>

          {/* ── Static black note heads ───────────────────────────────────── */}
          {MEASURE_IDX.map((ni, i) => {
            const n = ALL_NOTES[ni]
            const groupIdx = Math.floor(i / 4)
            const beamY = beams[groupIdx].y1
            return (
              <g key={`note-${i}`}>
                {/* Stem (note centre → beam) */}
                <line x1={noteXs[i]} y1={n.y} x2={noteXs[i]} y2={beamY}
                  stroke="currentColor" strokeWidth={1.3} className="ns-staff-line" />
                {/* Note head */}
                <ellipse cx={noteXs[i]} cy={n.y} rx={7} ry={5.5}
                  fill="currentColor" className="ns-staff-line" />
              </g>
            )
          })}

          {/* ── Beams (primary + secondary, drawn after note heads) ───────── */}
          {beams.map((b, gi) => (
            <g key={`beam-${gi}`}>
              <line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y1}
                stroke="currentColor" strokeWidth={4} className="ns-staff-line" />
              <line x1={b.x1} y1={b.y2} x2={b.x2} y2={b.y2}
                stroke="currentColor" strokeWidth={4} className="ns-staff-line" />
            </g>
          ))}

          {/* ── Trail: rainbow overlay fading back to invisible ───────────── */}
          {trail.map((s, ti) => {
            const ni = MEASURE_IDX[s]
            const n  = ALL_NOTES[ni]
            const opacity = ((ti + 1) / 6) * 0.55
            return (
              <ellipse key={`trail-${ti}`}
                cx={noteXs[s]} cy={n.y} rx={7} ry={5.5}
                fill={ALL_RAINBOW[ni]} opacity={opacity} />
            )
          })}

          {/* ── Active note: glow + rainbow fill ──────────────────────────── */}
          <ellipse cx={noteXs[currentStep]} cy={currentNote.y} rx={13} ry={11}
            fill={currentColor} opacity={0.20} />
          <ellipse cx={noteXs[currentStep]} cy={currentNote.y} rx={7} ry={5.5}
            fill={currentColor} />

          {/* ── Ripple (remounts each step to restart CSS animation) ─────── */}
          <circle
            key={`ripple-${step}`}
            cx={noteXs[currentStep]}
            cy={currentNote.y}
            r={8}
            fill="none"
            strokeWidth={2}
            stroke={currentColor}
            className="ns-ripple"
          />

          {/* ── Active note name ─────────────────────────────────────────── */}
          <text x={noteXs[currentStep]} y={196}
            textAnchor="middle" fontSize={12} fontWeight="700"
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
