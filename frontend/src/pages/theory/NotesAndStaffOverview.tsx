/**
 * NotesAndStaffOverview — animated piano grand staff.
 *
 * Uses VexFlow (the same engine as the rest of the app) to render a proper
 * treble + bass grand staff. Notes ascend from G2 to F5 then descend, with
 * each pitch lit up in rainbow colour and a ripple as it plays.
 *
 * Audio is OFF by default; the "♪ Listen" button enables it.
 * All audio stops when the user leaves the tab.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Beam, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow'
import { theoryAudio } from '../../lib/theoryAudio'

// ── Scale definition ──────────────────────────────────────────────────────────

interface ScaleNote {
  key:  string   // VexFlow key, e.g. 'g/2'
  name: string
  midi: number
  clef: 'bass' | 'treble'
}

// Bass clef: G2–B3  (10 notes)
const BASS_SCALE: ScaleNote[] = [
  { key: 'g/2', name: 'G2', midi: 43,  clef: 'bass' },
  { key: 'a/2', name: 'A2', midi: 45,  clef: 'bass' },
  { key: 'b/2', name: 'B2', midi: 47,  clef: 'bass' },
  { key: 'c/3', name: 'C3', midi: 48,  clef: 'bass' },
  { key: 'd/3', name: 'D3', midi: 50,  clef: 'bass' },
  { key: 'e/3', name: 'E3', midi: 52,  clef: 'bass' },
  { key: 'f/3', name: 'F3', midi: 53,  clef: 'bass' },
  { key: 'g/3', name: 'G3', midi: 55,  clef: 'bass' },
  { key: 'a/3', name: 'A3', midi: 57,  clef: 'bass' },
  { key: 'b/3', name: 'B3', midi: 59,  clef: 'bass' },
]

// Treble clef: C4–F5  (11 notes)
const TREBLE_SCALE: ScaleNote[] = [
  { key: 'c/4', name: 'C4', midi: 60,  clef: 'treble' },
  { key: 'd/4', name: 'D4', midi: 62,  clef: 'treble' },
  { key: 'e/4', name: 'E4', midi: 64,  clef: 'treble' },
  { key: 'f/4', name: 'F4', midi: 65,  clef: 'treble' },
  { key: 'g/4', name: 'G4', midi: 67,  clef: 'treble' },
  { key: 'a/4', name: 'A4', midi: 69,  clef: 'treble' },
  { key: 'b/4', name: 'B4', midi: 71,  clef: 'treble' },
  { key: 'c/5', name: 'C5', midi: 72,  clef: 'treble' },
  { key: 'd/5', name: 'D5', midi: 74,  clef: 'treble' },
  { key: 'e/5', name: 'E5', midi: 76,  clef: 'treble' },
  { key: 'f/5', name: 'F5', midi: 77,  clef: 'treble' },
]

const ALL_SCALE = [...BASS_SCALE, ...TREBLE_SCALE]   // 21 notes
const N = ALL_SCALE.length

// Up G2→F5, then down E5→A2 (top+bottom appear once per loop)
const SEQUENCE = [
  ...Array.from({ length: N     }, (_, i) => i),            // 0..20
  ...Array.from({ length: N - 2 }, (_, i) => N - 2 - i),   // 19..1
]

// Rainbow: red (G2) → violet (F5)
const RAINBOW = Array.from({ length: N }, (_, i) =>
  `hsl(${Math.round(i * 270 / (N - 1))}, 85%, 58%)`
)

// ── VexFlow rendering dimensions ─────────────────────────────────────────────

const VF_W         = 580
const VF_TREBLE_Y  = 18
const VF_BASS_Y    = 118
const VF_H         = 230
const VF_LEFT      = 14
const VF_STAVE_W   = VF_W - VF_LEFT - 14

// ── Note positions (filled after VexFlow render) ──────────────────────────────

interface NotePos { x: number; y: number }

// ── Main rendering function ───────────────────────────────────────────────────

function renderGrandStaff(container: HTMLDivElement): NotePos[] {
  container.innerHTML = ''

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(VF_W, VF_H)
  const ctx = renderer.getContext()

  // Make VexFlow SVG responsive
  const svgEl = container.querySelector('svg')
  if (svgEl) {
    svgEl.setAttribute('viewBox', `0 0 ${VF_W} ${VF_H}`)
    svgEl.style.width  = '100%'
    svgEl.style.height = 'auto'
    svgEl.style.maxWidth = `${VF_W}px`
  }

  // Staves
  const trebleStave = new Stave(VF_LEFT, VF_TREBLE_Y, VF_STAVE_W)
  trebleStave.addClef('treble').addTimeSignature('4/4')
  trebleStave.setContext(ctx).draw()

  const bassStave = new Stave(VF_LEFT, VF_BASS_Y, VF_STAVE_W)
  bassStave.addClef('bass').addTimeSignature('4/4')
  bassStave.setContext(ctx).draw()

  // Grand-staff connector (brace + barline on left)
  try {
    new StaveConnector(trebleStave, bassStave)
      .setType(StaveConnector.type.BRACE)
      .setContext(ctx).draw()
    new StaveConnector(trebleStave, bassStave)
      .setType(StaveConnector.type.SINGLE_LEFT)
      .setContext(ctx).draw()
  } catch {
    // StaveConnector API varies; skip if unavailable
  }

  // ── Bass voice: 10 real notes then 11 rests ─────────────────────────────
  const bassReal: StaveNote[] = BASS_SCALE.map(n =>
    new StaveNote({ keys: [n.key], duration: '16', clef: 'bass' })
  )
  const bassRests: StaveNote[] = Array.from({ length: TREBLE_SCALE.length }, () =>
    new StaveNote({ keys: ['b/2'], duration: '16r', clef: 'bass' })
  )
  const bassAll = [...bassReal, ...bassRests]

  // ── Treble voice: 10 rests then 11 real notes ───────────────────────────
  const trebleRests: StaveNote[] = Array.from({ length: BASS_SCALE.length }, () =>
    new StaveNote({ keys: ['b/4'], duration: '16r', clef: 'treble' })
  )
  const trebleReal: StaveNote[] = TREBLE_SCALE.map(n =>
    new StaveNote({ keys: [n.key], duration: '16', clef: 'treble' })
  )
  const trebleAll = [...trebleRests, ...trebleReal]

  // Beams — generated before formatting
  const bassBeams   = Beam.generateBeams(bassReal)
  const trebleBeams = Beam.generateBeams(trebleReal)

  // Voices
  const bassVoice   = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT)
  bassVoice.addTickables(bassAll)

  const trebleVoice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT)
  trebleVoice.addTickables(trebleAll)

  // Format both voices with shared x spacing
  new Formatter()
    .joinVoices([trebleVoice])
    .joinVoices([bassVoice])
    .formatToStave([trebleVoice, bassVoice], trebleStave)

  // Draw voices then beams
  trebleVoice.draw(ctx, trebleStave)
  bassVoice.draw(ctx, bassStave)
  bassBeams.forEach(b => b.setContext(ctx).draw())
  trebleBeams.forEach(b => b.setContext(ctx).draw())

  // ── Extract note-head positions ─────────────────────────────────────────
  const positions: NotePos[] = []

  const extractPos = (notes: StaveNote[]): void => {
    for (const note of notes) {
      const bb = note.getBoundingBox()
      // getYs() gives the actual note-head y values (available after draw)
      const ys: number[] = typeof (note as {getYs?:()=>number[]}).getYs === 'function'
        ? (note as {getYs:()=>number[]}).getYs()
        : []
      positions.push({
        x: bb ? bb.getX() + bb.getW() / 2 : 0,
        y: ys.length > 0 ? ys[0] : (bb ? bb.getY() + bb.getH() / 2 : 0),
      })
    }
  }

  extractPos(bassReal)    // indices 0–9
  extractPos(trebleReal)  // indices 10–20

  return positions
}

// ── Timing ────────────────────────────────────────────────────────────────────

const STEP_MS  = 280   // ms per step  (≈ 54 BPM quarter note — gently slow)
const NOTE_DUR = 0.30  // seconds each pitch rings

// ── Component ─────────────────────────────────────────────────────────────────

export function NotesAndStaffOverview() {
  const containerRef  = useRef<HTMLDivElement>(null)
  const [positions, setPositions]   = useState<NotePos[]>([])
  const [step,      setStep]        = useState(0)
  const [history,   setHistory]     = useState<number[]>([])
  const [isAudioOn, setIsAudioOn]   = useState(false)

  // Render VexFlow once on mount
  useEffect(() => {
    if (!containerRef.current) return
    try {
      const pos = renderGrandStaff(containerRef.current)
      setPositions(pos)
    } catch (e) {
      console.error('Grand staff render error:', e)
    }
  }, [])

  // Stop audio when user leaves the tab
  useEffect(() => {
    const onVis = () => { if (document.hidden) { theoryAudio.stop(); setIsAudioOn(false) } }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Advance each step
  useEffect(() => {
    const ni = SEQUENCE[step]
    if (isAudioOn) {
      try { theoryAudio.playNote(ALL_SCALE[ni].midi, NOTE_DUR) } catch { /* blocked */ }
    }
    setHistory(prev => [...prev.slice(-5), step])
    const t = window.setTimeout(() => setStep(s => (s + 1) % SEQUENCE.length), STEP_MS)
    return () => clearTimeout(t)
  }, [step, isAudioOn])

  const toggleAudio = useCallback(() => {
    setIsAudioOn(on => { if (on) theoryAudio.stop(); return !on })
  }, [])

  const currentStep = history[history.length - 1] ?? 0
  const currentNI   = SEQUENCE[currentStep]
  const currentPos  = positions[currentNI]
  const trail       = history.slice(0, -1)

  return (
    <div className="ns-overview">
      <p className="ns-overview-title">The Grand Staff</p>
      <p className="ns-overview-subtitle">G2 → F5 · bass &amp; treble · ascending and descending</p>

      {/* Staff container — VexFlow renders here; overlay SVG sits on top */}
      <div className="ns-staff-wrap" style={{ position: 'relative' }}>
        <div ref={containerRef} />

        {/* Animation overlay — same viewBox as the VexFlow SVG */}
        {positions.length > 0 && (
          <svg
            viewBox={`0 0 ${VF_W} ${VF_H}`}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            {/* Trail — recent notes fading from rainbow back to invisible */}
            {trail.map((si, ti) => {
              const ni  = SEQUENCE[si]
              const pos = positions[ni]
              if (!pos) return null
              return (
                <ellipse
                  key={`trail-${ti}`}
                  cx={pos.x} cy={pos.y}
                  rx={9} ry={7}
                  fill={RAINBOW[ni]}
                  opacity={((ti + 1) / trail.length) * 0.5}
                />
              )
            })}

            {/* Active note — glow halo + filled note head + ripple */}
            {currentPos && (
              <>
                {/* Glow */}
                <ellipse cx={currentPos.x} cy={currentPos.y}
                  rx={15} ry={12}
                  fill={RAINBOW[currentNI]} opacity={0.22} />

                {/* Coloured note head (covers the black VexFlow head) */}
                <ellipse cx={currentPos.x} cy={currentPos.y}
                  rx={9} ry={7}
                  fill={RAINBOW[currentNI]} />

                {/* Ripple — remounts each step to restart CSS animation */}
                <circle
                  key={`ripple-${step}`}
                  cx={currentPos.x} cy={currentPos.y}
                  r={8}
                  fill="none"
                  strokeWidth={2}
                  stroke={RAINBOW[currentNI]}
                  className="ns-ripple"
                />

                {/* Note name below the staff */}
                <text
                  x={currentPos.x} y={VF_H - 6}
                  textAnchor="middle"
                  fontSize={12} fontWeight="700"
                  fill={RAINBOW[currentNI]}
                  fontFamily="system-ui, sans-serif"
                >
                  {ALL_SCALE[currentNI].name}
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
