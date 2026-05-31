/**
 * NotesAndStaffOverview — animated piano grand staff.
 *
 * Uses VexFlow to render a proper treble + bass grand staff.
 * Notes ascend G2 → F5 and loop (left to right, no backwards pass).
 * Each pitch lights up with its rainbow colour and a ripple as it plays.
 *
 * Dot positions are computed with stave.getYForLine() (exact note-head y)
 * and the note bounding-box centre (exact note-head x) so they sit
 * precisely on the note heads rather than on stem centres.
 *
 * Audio is OFF by default; "♪ Listen to notes" enables it.
 * All audio stops instantly when the user leaves the tab.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Beam, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow'
import { theoryAudio } from '../../lib/theoryAudio'

// ── Scale ─────────────────────────────────────────────────────────────────────

interface ScaleNote {
  key:  string             // VexFlow pitch key, e.g. 'g/2'
  name: string
  midi: number
  clef: 'bass' | 'treble'
}

// Bass clef  G2–B3  (10 notes)
const BASS_SCALE: ScaleNote[] = [
  { key: 'g/2', name: 'G2', midi: 43, clef: 'bass' },
  { key: 'a/2', name: 'A2', midi: 45, clef: 'bass' },
  { key: 'b/2', name: 'B2', midi: 47, clef: 'bass' },
  { key: 'c/3', name: 'C3', midi: 48, clef: 'bass' },
  { key: 'd/3', name: 'D3', midi: 50, clef: 'bass' },
  { key: 'e/3', name: 'E3', midi: 52, clef: 'bass' },
  { key: 'f/3', name: 'F3', midi: 53, clef: 'bass' },
  { key: 'g/3', name: 'G3', midi: 55, clef: 'bass' },
  { key: 'a/3', name: 'A3', midi: 57, clef: 'bass' },
  { key: 'b/3', name: 'B3', midi: 59, clef: 'bass' },
]

// Treble clef  C4–F5  (11 notes)
const TREBLE_SCALE: ScaleNote[] = [
  { key: 'c/4', name: 'C4', midi: 60, clef: 'treble' },
  { key: 'd/4', name: 'D4', midi: 62, clef: 'treble' },
  { key: 'e/4', name: 'E4', midi: 64, clef: 'treble' },
  { key: 'f/4', name: 'F4', midi: 65, clef: 'treble' },
  { key: 'g/4', name: 'G4', midi: 67, clef: 'treble' },
  { key: 'a/4', name: 'A4', midi: 69, clef: 'treble' },
  { key: 'b/4', name: 'B4', midi: 71, clef: 'treble' },
  { key: 'c/5', name: 'C5', midi: 72, clef: 'treble' },
  { key: 'd/5', name: 'D5', midi: 74, clef: 'treble' },
  { key: 'e/5', name: 'E5', midi: 76, clef: 'treble' },
  { key: 'f/5', name: 'F5', midi: 77, clef: 'treble' },
]

const ALL_SCALE = [...BASS_SCALE, ...TREBLE_SCALE]   // 21 notes, indices 0–20
const N = ALL_SCALE.length

// ── Colour ────────────────────────────────────────────────────────────────────

// Rainbow: red (G2) → violet (F5)
const RAINBOW = Array.from({ length: N }, (_, i) =>
  `hsl(${Math.round(i * 270 / (N - 1))}, 85%, 58%)`
)

// ── Staff-line numbers for exact note-head y ──────────────────────────────────
// VexFlow convention: line 0 = top staff line, line 4 = bottom staff line.
// Spaces are half-integer values (0.5, 1.5, …).
// Notes outside the staff use values beyond 0 / 4.

const BASS_LINE: Record<string, number> = {
  'b/3': -0.5,  // just above top bass line (A3)
  'a/3':  0,
  'g/3':  0.5,
  'f/3':  1,
  'e/3':  1.5,
  'd/3':  2,
  'c/3':  2.5,
  'b/2':  3,
  'a/2':  3.5,
  'g/2':  4,
}

const TREBLE_LINE: Record<string, number> = {
  'f/5':  0,
  'e/5':  0.5,
  'd/5':  1,
  'c/5':  1.5,
  'b/4':  2,
  'a/4':  2.5,
  'g/4':  3,
  'f/4':  3.5,
  'e/4':  4,
  'd/4':  4.5,
  'c/4':  5,    // ledger line below treble staff
}

// ── VexFlow layout ────────────────────────────────────────────────────────────

const VF_W        = 580
const VF_TREBLE_Y = 18    // treble top line (F5) y
const VF_BASS_Y   = 78    // bass top line (A3) y — 20px below treble bottom line (E4=58),
                           // matching the standard 5th interval at 5px per staff step
const VF_H        = 150   // G2 sits at y=118; 150 leaves room for note-name label
const VF_LEFT     = 14
const VF_STAVE_W  = VF_W - VF_LEFT - 14

// ── Timing ────────────────────────────────────────────────────────────────────

const STEP_MS  = 280   // ms per note  (≈ 54 BPM quarter — gently slow)
const NOTE_DUR = 0.30  // seconds each pitch rings

// ── Position type ─────────────────────────────────────────────────────────────

interface NotePos { x: number; y: number }

// ── VexFlow rendering + position extraction ───────────────────────────────────

function renderGrandStaff(container: HTMLDivElement): NotePos[] {
  container.innerHTML = ''

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(VF_W, VF_H)
  const ctx = renderer.getContext()

  // Make VexFlow SVG responsive
  const svgEl = container.querySelector('svg')
  if (svgEl) {
    svgEl.setAttribute('viewBox', `0 0 ${VF_W} ${VF_H}`)
    svgEl.style.width    = '100%'
    svgEl.style.height   = 'auto'
    svgEl.style.maxWidth = `${VF_W}px`
  }

  // Staves
  const trebleStave = new Stave(VF_LEFT, VF_TREBLE_Y, VF_STAVE_W)
  trebleStave.addClef('treble').addTimeSignature('4/4')
  trebleStave.setContext(ctx).draw()

  const bassStave = new Stave(VF_LEFT, VF_BASS_Y, VF_STAVE_W)
  bassStave.addClef('bass').addTimeSignature('4/4')
  bassStave.setContext(ctx).draw()

  // Grand-staff connector (brace + barline)
  try {
    new StaveConnector(trebleStave, bassStave)
      .setType(StaveConnector.type.BRACE)
      .setContext(ctx).draw()
    new StaveConnector(trebleStave, bassStave)
      .setType(StaveConnector.type.SINGLE_LEFT)
      .setContext(ctx).draw()
  } catch { /* skip if API varies */ }

  // ── Bass voice: 10 real notes + 11 rests ─────────────────────────────────
  const bassReal: StaveNote[] = BASS_SCALE.map(n =>
    new StaveNote({ keys: [n.key], duration: '16', clef: 'bass' })
  )
  const bassRests: StaveNote[] = Array.from({ length: TREBLE_SCALE.length }, () =>
    new StaveNote({ keys: ['b/2'], duration: '16r', clef: 'bass' })
  )

  // ── Treble voice: 10 rests + 11 real notes ────────────────────────────────
  const trebleRests: StaveNote[] = Array.from({ length: BASS_SCALE.length }, () =>
    new StaveNote({ keys: ['b/4'], duration: '16r', clef: 'treble' })
  )
  const trebleReal: StaveNote[] = TREBLE_SCALE.map(n =>
    new StaveNote({ keys: [n.key], duration: '16', clef: 'treble' })
  )

  // Beams generated before formatting
  const bassBeams   = Beam.generateBeams(bassReal)
  const trebleBeams = Beam.generateBeams(trebleReal)

  // Voices in SOFT mode
  const bassVoice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT)
  bassVoice.addTickables([...bassReal, ...bassRests])

  const trebleVoice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT)
  trebleVoice.addTickables([...trebleRests, ...trebleReal])

  // Format both voices with shared x spacing (so ascending scale goes L→R across both staves)
  new Formatter()
    .joinVoices([trebleVoice])
    .joinVoices([bassVoice])
    .formatToStave([trebleVoice, bassVoice], trebleStave)

  // Draw voices + beams
  trebleVoice.draw(ctx, trebleStave)
  bassVoice.draw(ctx, bassStave)
  bassBeams.forEach(b => b.setContext(ctx).draw())
  trebleBeams.forEach(b => b.setContext(ctx).draw())

  // ── Extract note-head positions ───────────────────────────────────────────
  //
  // X: bounding-box centre (accurate for note head, symmetric in 16th notes)
  // Y: stave.getYForLine(staffLine) — the EXACT note-head y, avoiding the
  //    stem-centre error that getBoundingBox() y+h/2 would give.

  const getX = (note: StaveNote): number => {
    const bb = note.getBoundingBox()
    return bb ? bb.getX() + bb.getW() / 2 : 0
  }

  const bassPositions: NotePos[] = BASS_SCALE.map((sn, i) => ({
    x: getX(bassReal[i]),
    y: bassStave.getYForLine(BASS_LINE[sn.key] ?? 2),
  }))

  const treblePositions: NotePos[] = TREBLE_SCALE.map((sn, i) => ({
    x: getX(trebleReal[i]),
    y: trebleStave.getYForLine(TREBLE_LINE[sn.key] ?? 2),
  }))

  return [...bassPositions, ...treblePositions]   // indices 0–20, matches ALL_SCALE
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotesAndStaffOverview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions]   = useState<NotePos[]>([])
  const [step,      setStep]        = useState(0)
  const [isAudioOn, setIsAudioOn]   = useState(false)

  // Render VexFlow once on mount
  useEffect(() => {
    if (!containerRef.current) return
    try {
      setPositions(renderGrandStaff(containerRef.current))
    } catch (e) {
      console.error('Grand staff render:', e)
    }
  }, [])

  // Stop audio on tab hide
  useEffect(() => {
    const onVis = () => { if (document.hidden) { theoryAudio.stop(); setIsAudioOn(false) } }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Advance animation — always ascending, looping left to right
  useEffect(() => {
    if (isAudioOn) {
      try { theoryAudio.playNote(ALL_SCALE[step].midi, NOTE_DUR) } catch { /* blocked */ }
    }
    const t = window.setTimeout(() => setStep(s => (s + 1) % N), STEP_MS)
    return () => clearTimeout(t)
  }, [step, isAudioOn])

  const toggleAudio = useCallback(() => {
    setIsAudioOn(on => { if (on) theoryAudio.stop(); return !on })
  }, [])

  const currentPos   = positions[step]
  const currentColor = RAINBOW[step]

  return (
    <div className="ns-overview">
      <p className="ns-overview-title">The Grand Staff</p>
      <p className="ns-overview-subtitle">G2 → F5 · bass &amp; treble · piano range</p>

      {/* VexFlow staff + ripple overlay */}
      <div className="ns-staff-wrap" style={{ position: 'relative' }}>
        <div ref={containerRef} />

        {/* Overlay SVG — same viewBox as the VexFlow SVG so coordinates align */}
        {positions.length > 0 && (
          <svg
            viewBox={`0 0 ${VF_W} ${VF_H}`}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            {/* Ripple only — remounts each step to restart the CSS animation */}
            {currentPos && (
              <>
                <circle
                  key={`rpl-${step}`}
                  cx={currentPos.x} cy={currentPos.y}
                  r={7} fill="none" strokeWidth={2}
                  stroke={currentColor} className="ns-ripple"
                />
                <text
                  x={currentPos.x} y={VF_H - 4}
                  textAnchor="middle" fontSize={11} fontWeight="700"
                  fill={currentColor} fontFamily="system-ui, sans-serif"
                >
                  {ALL_SCALE[step].name}
                </text>
              </>
            )}
          </svg>
        )}
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
