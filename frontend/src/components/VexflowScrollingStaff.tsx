/**
 * VexflowScrollingStaff — auto-scrolling sheet music animation.
 *
 * Replaces the hand-rolled MusicNoteCanvas on the Home and About pages.
 * Renders a looping reel of VexFlow measures and fires a white-noise click
 * + rainbow ripple each time a note head crosses the centre of the screen.
 *
 * No user input. Purely decorative.
 */

import { memo, useEffect, useRef, useState } from 'react'
import { renderPattern } from '../lib/vexflowPattern'
import { generateReel, type GeneratedMeasure } from '../lib/rhythmGenerator'
import { triggerRainbowBurst } from '../lib/rippleEngine'
import { SLOT_PX, msPerMeasure } from '../lib/playAlongTiming'

const REEL_COUNT      = 12
const BPM             = 60
// Cursor at screen centre — notes fire + ripple at the midpoint.
// (PlayAlong uses 0.25; this component deliberately uses its own value.)
const HOME_CURSOR_FRAC = 0.5

// ── Toneless click — high-pass filtered white-noise burst ─────────────────────
// Matches the original MusicNoteCanvas sound: percussive, pitch-neutral, 40 ms.
// Uses its own short-lived AudioContext so it never interferes with tickEngine.
function playClick() {
  try {
    const ctx    = new AudioContext()
    const bufLen = Math.ceil(ctx.sampleRate * 0.04)
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data   = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1
    const src  = ctx.createBufferSource()
    src.buffer = buf
    const hp   = ctx.createBiquadFilter()
    hp.type    = 'highpass'
    hp.frequency.value = 800
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
    src.connect(hp)
    hp.connect(gain)
    gain.connect(ctx.destination)
    src.start()
    src.onended = () => void ctx.close()
  } catch { /* audio unavailable — silently skip */ }
}

// ── Main component ────────────────────────────────────────────────────────────

export function VexflowScrollingStaff() {
  const viewportRef  = useRef<HTMLDivElement>(null)
  const trackRef     = useRef<HTMLDivElement>(null)
  const rafRef       = useRef(0)
  const startTimeRef = useRef(0)
  const firedRef     = useRef(new Set<string>())

  // Note anchors for the FIRST copy only (second copy is visual only)
  const anchorsRef = useRef<Map<number, Array<{ eventIndex: number; x: number }>>>(
    new Map(),
  )

  const [measures] = useState<GeneratedMeasure[]>(() =>
    generateReel(REEL_COUNT, Math.floor(Math.random() * 99_999)),
  )

  useEffect(() => {
    startTimeRef.current = performance.now()
    const mspM   = msPerMeasure(BPM)
    const loopMs = REEL_COUNT * mspM  // duration of one full reel pass

    const frame = () => {
      let elapsed = performance.now() - startTimeRef.current

      // ── Seamless loop reset ──────────────────────────────────────────────────
      // When one loop has elapsed, step startTime forward by exactly loopMs.
      // Because the track holds TWO copies of the measures side by side, the
      // second copy is now visually identical to where the first copy was at
      // elapsed = 0 — no jump, no flash, infinite scroll.
      if (elapsed >= loopMs) {
        startTimeRef.current += loopMs
        elapsed -= loopMs
        firedRef.current.clear()
      }

      const vpWidth = viewportRef.current?.offsetWidth ?? window.innerWidth
      const cursorX = vpWidth * HOME_CURSOR_FRAC

      // Linear translation (no modulo — the reset above keeps elapsed < loopMs)
      const tx = cursorX - elapsed * (SLOT_PX / mspM)

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${tx}px)`
      }

      // ── Note-crossing detection (first copy only) ────────────────────────────
      // The second copy is purely visual; its notes fire when it becomes the
      // first copy on the next loop iteration.
      for (let mi = 0; mi < REEL_COUNT; mi++) {
        const anchors = anchorsRef.current.get(mi) ?? []
        for (const a of anchors) {
          const key = `${mi}-${a.eventIndex}`
          if (firedRef.current.has(key)) continue
          // Absolute screen-X of this note head
          const absX = mi * SLOT_PX + a.x + tx
          if (absX <= cursorX) {
            firedRef.current.add(key)
            const rect = viewportRef.current?.getBoundingClientRect()
            if (rect) {
              playClick()
              triggerRainbowBurst(rect.left + cursorX, rect.top + rect.height / 2)
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Render TWO copies of the measures back-to-back for seamless looping
  const doubled = [...measures, ...measures]

  return (
    <div ref={viewportRef} className="vss-viewport">
      <div
        ref={trackRef}
        className="vss-track"
        style={{ width: `${doubled.length * SLOT_PX}px` }}
      >
        {doubled.map((measure, i) => (
          <VSSMeasureBlock
            key={i}
            measure={measure}
            // Only register anchors for the first copy
            onAnchors={i < REEL_COUNT
              ? (anchors) => { anchorsRef.current.set(i, anchors) }
              : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}

// ── Individual measure block ──────────────────────────────────────────────────

interface VSSMeasureBlockProps {
  measure: GeneratedMeasure
  onAnchors?: (anchors: Array<{ eventIndex: number; x: number }>) => void
}

const VSSMeasureBlock = memo(function VSSMeasureBlock({
  measure,
  onAnchors,
}: VSSMeasureBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try {
      const result = renderPattern(
        el,
        { events: measure.events },
        measure.timeSigTop,
        measure.timeSigBottom,
        {
          fixedTotalWidth: SLOT_PX,
          showClef: measure.showClef,
          showTimeSignature: measure.showTimeSig,
          seamless: true,
        },
      )
      onAnchors?.(result.anchors)
    } catch {
      // silently ignore VexFlow render errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="vss-measure">
      <div className="vss-notation-wrapper">
        <div ref={containerRef} className="pa-notation-container" />
      </div>
    </div>
  )
})
