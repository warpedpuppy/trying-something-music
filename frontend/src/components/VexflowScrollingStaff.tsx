/**
 * VexflowScrollingStaff — truly infinite auto-scrolling sheet music animation.
 *
 * ### Why three copies?
 *
 * Two copies (previous approach) caused a visible "tail flash": at the moment
 * we reset startTime, the last measure of copy 1 was still ~20 px visible on
 * the left side of the screen.  When tx jumped back, that measure vanished.
 *
 * Three copies solve this cleanly:
 *   - Copy 1  fills the LEFT  (provides the "tail" already past the cursor)
 *   - Copy 2  is the LIVE copy  (its notes fire clicks/ripples)
 *   - Copy 3  fills the RIGHT  (provides upcoming measures before copy 2 loops)
 *
 * tx is initialised so that copy 2's first measure is exactly at the cursor
 * when elapsed = 0:
 *
 *   tx = cursorX − REEL_COUNT × SLOT_PX − elapsed × (SLOT_PX / mspM)
 *
 * At elapsed = loopMs we advance startTime by loopMs and clear firedRef.
 * At that instant, copy 3 is visually where copy 2 was, copy 2 is where
 * copy 1 was — identical content in identical positions, no jump ever.
 *
 * No user input. Purely decorative. PlayAlong.tsx is not touched.
 */

import { memo, useEffect, useRef, useState } from 'react'
import { renderPattern } from '../lib/vexflowPattern'
import { generateReel, type GeneratedMeasure } from '../lib/rhythmGenerator'
import { triggerRainbowBurst } from '../lib/rippleEngine'
import { SLOT_PX, msPerMeasure } from '../lib/playAlongTiming'

const REEL_COUNT       = 12
const BPM              = 60
// Cursor at screen centre — notes fire + ripple at the midpoint.
const HOME_CURSOR_FRAC = 0.5

// ── Toneless click — high-pass filtered white-noise burst ─────────────────────
// Matches the original MusicNoteCanvas sound: percussive, pitch-neutral, 40 ms.
// Uses its own short-lived AudioContext, independent of tickEngine.
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

  // Anchors for copy 2's measures (indices 0..REEL_COUNT-1 used for timing)
  const anchorsRef = useRef<Map<number, Array<{ eventIndex: number; x: number }>>>(
    new Map(),
  )

  const [measures] = useState<GeneratedMeasure[]>(() =>
    generateReel(REEL_COUNT, Math.floor(Math.random() * 99_999)),
  )

  useEffect(() => {
    startTimeRef.current = performance.now()
    const mspM   = msPerMeasure(BPM)
    const loopMs = REEL_COUNT * mspM

    const frame = () => {
      let elapsed = performance.now() - startTimeRef.current

      // ── Seamless loop reset ──────────────────────────────────────────────────
      // Step startTime forward by exactly one loop duration so elapsed resets
      // to ≈0.  Copy 3 is now visually at copy 2's former position (identical
      // content) — the scroll looks continuous from every vantage point.
      if (elapsed >= loopMs) {
        startTimeRef.current += loopMs
        elapsed -= loopMs
        firedRef.current.clear()
      }

      const vpWidth = viewportRef.current?.offsetWidth ?? window.innerWidth
      if (vpWidth === 0) { rafRef.current = requestAnimationFrame(frame); return }
      const cursorX = vpWidth * HOME_CURSOR_FRAC

      // tx positions copy 2's first measure at cursorX when elapsed = 0.
      // Copy 1 is one reel-width to the left; copy 3 one reel-width to the right.
      const tx = cursorX - REEL_COUNT * SLOT_PX - elapsed * (SLOT_PX / mspM)

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${tx}px)`
      }

      // ── Note-crossing detection (copy 2 only) ────────────────────────────────
      // Copy 2's measure mi occupies slot (REEL_COUNT + mi) in the track.
      // Its absolute screen-x: (REEL_COUNT + mi)*SLOT_PX + anchor.x + tx
      //   = mi*SLOT_PX + anchor.x + cursorX − elapsed*(SLOT_PX/mspM)
      // It crosses cursorX when: elapsed ≥ (mi*SLOT_PX + anchor.x) * mspM/SLOT_PX
      for (let mi = 0; mi < REEL_COUNT; mi++) {
        const anchors = anchorsRef.current.get(mi) ?? []
        for (const a of anchors) {
          const key = `${mi}-${a.eventIndex}`
          if (firedRef.current.has(key)) continue
          // Use copy 2's actual track position for the absX check
          const absX = (REEL_COUNT + mi) * SLOT_PX + a.x + tx
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

  // Three copies: copy1 (tail) | copy2 (live) | copy3 (head)
  const tripled = [...measures, ...measures, ...measures]

  return (
    <div ref={viewportRef} className="vss-viewport">
      <div
        ref={trackRef}
        className="vss-track"
        style={{ width: `${tripled.length * SLOT_PX}px` }}
      >
        {tripled.map((measure, i) => (
          <VSSMeasureBlock
            key={i}
            measure={measure}
            // Only register anchors for copy 1's blocks (indices 0..REEL_COUNT-1).
            // These are used as the timing reference — the formula is copy-agnostic.
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
