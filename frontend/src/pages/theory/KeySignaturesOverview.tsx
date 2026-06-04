/**
 * KeySignaturesOverview — animated circle-of-fifths staff.
 *
 * Renders a treble clef measure (clef + key signature + 4/4 + whole note on tonic)
 * and slowly cycles through all 13 major keys in circle-of-fifths order.
 * A downward arrow overlays the key signature zone to label what the viewer is watching.
 */

import { useEffect, useRef, useState } from 'react'
import { Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow'

// ── Layout constants ─────────────────────────────────────────────────────────
// Extra headroom above STAVE_Y so the treble-clef curl never clips.
// Extra room below so the clef tail and ledger-line notes never clip.

const VF_W       = 380
const STAVE_Y    = 80   // top staff line — extra space above for treble-clef curl
const VF_H       = 170  // total SVG height — room for clef tail below stave bottom
const VF_LEFT    = 10
const STAVE_W    = VF_W - VF_LEFT - 10

const ARROW_TIP_Y  = STAVE_Y - 8    // points just above top staff line
const ARROW_BASE_Y = ARROW_TIP_Y - 20
const ARROW_HW     = 7
const ACCENT       = 'hsl(35, 80%, 45%)'

// ── Circle of fifths data ─────────────────────────────────────────────────────

interface KeyEntry {
  vfKey: string
  sf: number
  label: string
  tonic: string
}

const CIRCLE: KeyEntry[] = [
  { vfKey: 'C',  sf:  0, label: 'C major',  tonic: 'c/5'  },
  { vfKey: 'G',  sf:  1, label: 'G major',  tonic: 'g/4'  },
  { vfKey: 'D',  sf:  2, label: 'D major',  tonic: 'd/5'  },
  { vfKey: 'A',  sf:  3, label: 'A major',  tonic: 'a/4'  },
  { vfKey: 'E',  sf:  4, label: 'E major',  tonic: 'e/5'  },
  { vfKey: 'B',  sf:  5, label: 'B major',  tonic: 'b/4'  },
  { vfKey: 'F#', sf:  6, label: 'F♯ major', tonic: 'f/5'  },
  { vfKey: 'F',  sf: -1, label: 'F major',  tonic: 'f/4'  },
  { vfKey: 'Bb', sf: -2, label: 'B♭ major', tonic: 'bb/4' },
  { vfKey: 'Eb', sf: -3, label: 'E♭ major', tonic: 'eb/5' },
  { vfKey: 'Ab', sf: -4, label: 'A♭ major', tonic: 'ab/4' },
  { vfKey: 'Db', sf: -5, label: 'D♭ major', tonic: 'db/5' },
  { vfKey: 'Gb', sf: -6, label: 'G♭ major', tonic: 'gb/4' },
]

// ── VexFlow rendering ─────────────────────────────────────────────────────────

function renderKeyStaff(
  container: HTMLDivElement,
  vfKey: string,
  tonic: string,
): number {
  container.innerHTML = ''

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(VF_W, VF_H)
  const ctx = renderer.getContext()

  const svgEl = container.querySelector('svg')
  if (svgEl) {
    svgEl.setAttribute('viewBox', `0 0 ${VF_W} ${VF_H}`)
    svgEl.style.width    = '100%'
    svgEl.style.height   = 'auto'
    svgEl.style.display  = 'block'
    svgEl.style.overflow = 'visible'   // never clip glyph edges
  }

  const stave = new Stave(VF_LEFT, STAVE_Y, STAVE_W)
  stave.addClef('treble').addKeySignature(vfKey).addTimeSignature('4/4')
  stave.setContext(ctx).draw()

  const noteStartX = stave.getNoteStartX()
  const clefEndX   = VF_LEFT + 38
  const keySigEndX = noteStartX - 28
  const arrowX     = (clefEndX + Math.max(keySigEndX, clefEndX + 4)) / 2

  const note = new StaveNote({ keys: [tonic], duration: 'w', clef: 'treble' })
  const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT)
  voice.addTickables([note])
  new Formatter().joinVoices([voice]).formatToStave([voice], stave)
  voice.draw(ctx, stave)

  return arrowX
}

// ── Component ─────────────────────────────────────────────────────────────────

export function KeySignaturesOverview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [keyIdx, setKeyIdx] = useState(0)
  const [arrowX, setArrowX] = useState(54)

  useEffect(() => {
    const t = window.setTimeout(() => setKeyIdx(i => (i + 1) % CIRCLE.length), 2500)
    return () => clearTimeout(t)
  }, [keyIdx])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const entry = CIRCLE[keyIdx]
    try {
      setArrowX(renderKeyStaff(el, entry.vfKey, entry.tonic))
    } catch (e) {
      console.error('KeySig render:', e)
    }
  }, [keyIdx])

  const entry = CIRCLE[keyIdx]
  const sfText =
    entry.sf === 0 ? 'no accidentals'
    : entry.sf > 0 ? `${entry.sf} sharp${entry.sf !== 1 ? 's' : ''}`
    :                `${-entry.sf} flat${entry.sf !== -1 ? 's' : ''}`

  return (
    <div className="ks-overview">
      <p key={`label-${keyIdx}`} className="ks-overview-key">{entry.label}</p>
      <p className="ks-overview-sf">{sfText}</p>

      {/* Staff + arrow — constrained to half-size, never clips */}
      <div className="ks-staff-wrap">
        <div key={`staff-${keyIdx}`} ref={containerRef} className="ks-staff-fadein" />

        <svg
          viewBox={`0 0 ${VF_W} ${VF_H}`}
          className="ks-arrow-svg"
          aria-hidden="true"
        >
          <line
            x1={arrowX} y1={ARROW_BASE_Y}
            x2={arrowX} y2={ARROW_TIP_Y}
            stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round"
          />
          <polygon
            points={`${arrowX},${ARROW_TIP_Y} ${arrowX - ARROW_HW},${ARROW_BASE_Y} ${arrowX + ARROW_HW},${ARROW_BASE_Y}`}
            fill={ACCENT}
          />
          <text
            x={arrowX} y={ARROW_BASE_Y - 5}
            textAnchor="middle"
            fontSize="11"
            fontFamily="system-ui, sans-serif"
            fontWeight="600"
            fill={ACCENT}
          >
            key sig
          </text>
        </svg>
      </div>

      {/* Dot progress indicator */}
      <div className="ks-dots" aria-hidden="true">
        {CIRCLE.map((k, i) => (
          <div key={k.vfKey} className={`ks-dot${i === keyIdx ? ' active' : ''}`} />
        ))}
      </div>

      {/* Summary text */}
      <div className="ks-description">
        <p>
          A <strong>key signature</strong> appears right after the clef at the start of
          every staff line. It marks which notes are permanently sharp or flat throughout
          the piece, so you don't need an accidental sign on every individual note.
        </p>
        <p>
          Each step clockwise around the circle of fifths adds one sharp; each step
          counter-clockwise adds one flat. C major has none — making it the natural
          starting point of the circle.
        </p>
      </div>
    </div>
  )
}
