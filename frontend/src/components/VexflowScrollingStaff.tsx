/**
 * VexflowScrollingStaff — auto-scrolling sheet music animation.
 *
 * Replaces the hand-rolled MusicNoteCanvas on the Home and About pages.
 * Renders a looping reel of VexFlow measures (same approach as PlayAlong)
 * and fires a click + rainbow ripple each time a note head crosses the cursor.
 *
 * No user input. Purely decorative.
 */

import { memo, useEffect, useRef, useState } from 'react'
import { renderPattern } from '../lib/vexflowPattern'
import { generateReel, type GeneratedMeasure } from '../lib/rhythmGenerator'
import { tickEngine } from '../lib/audio'
import { triggerRainbowBurst } from '../lib/rippleEngine'
import {
  SLOT_PX,
  CURSOR_FRAC,
  msPerMeasure,
  reelTranslateX,
} from '../lib/playAlongTiming'

// 12 measures × 4 s each = 48-second loop at 60 BPM — enough variety,
// short enough to never feel static.
const REEL_COUNT = 12
const BPM = 60

export function VexflowScrollingStaff() {
  const viewportRef  = useRef<HTMLDivElement>(null)
  const trackRef     = useRef<HTMLDivElement>(null)
  const rafRef       = useRef(0)
  const startTimeRef = useRef(0)
  const prevGenRef   = useRef(0)
  const firedRef     = useRef(new Set<string>())

  // note anchors populated by VSSMeasureBlock after VexFlow renders
  const anchorsRef = useRef<Map<number, Array<{ eventIndex: number; x: number }>>>(
    new Map(),
  )

  // Fresh random reel on every mount
  const [measures] = useState<GeneratedMeasure[]>(() =>
    generateReel(REEL_COUNT, Math.floor(Math.random() * 99_999)),
  )

  useEffect(() => {
    startTimeRef.current = performance.now()
    const mspM   = msPerMeasure(BPM)
    const loopMs = REEL_COUNT * mspM

    const frame = () => {
      const elapsed = performance.now() - startTimeRef.current
      const vpWidth = viewportRef.current?.offsetWidth ?? window.innerWidth

      // Detect loop wrap and reset fired-set so notes fire again next cycle
      const gen = Math.floor(elapsed / loopMs)
      if (gen > prevGenRef.current) {
        prevGenRef.current = gen
        firedRef.current.clear()
      }

      // Scroll the reel
      const tx = reelTranslateX(elapsed, vpWidth, mspM, loopMs)
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${tx}px)`
      }

      // Note-crossing detection
      const cursorX = vpWidth * CURSOR_FRAC
      for (let mi = 0; mi < REEL_COUNT; mi++) {
        const anchors = anchorsRef.current.get(mi) ?? []
        for (const a of anchors) {
          const key = `${mi}-${a.eventIndex}`
          if (firedRef.current.has(key)) continue
          // absoluteX = left edge of this measure slot + note's x within it + scroll
          const absX = mi * SLOT_PX + a.x + tx
          if (absX <= cursorX) {
            firedRef.current.add(key)
            const rect = viewportRef.current?.getBoundingClientRect()
            if (rect) {
              tickEngine.tick('tap')
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

  return (
    <div ref={viewportRef} className="vss-viewport">
      <div
        ref={trackRef}
        className="vss-track"
        style={{ width: `${REEL_COUNT * SLOT_PX}px` }}
      >
        {measures.map((measure, i) => (
          <VSSMeasureBlock
            key={i}
            measure={measure}
            onAnchors={anchors => { anchorsRef.current.set(i, anchors) }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Individual measure block ──────────────────────────────────────────────────

interface VSSMeasureBlockProps {
  measure: GeneratedMeasure
  onAnchors: (anchors: Array<{ eventIndex: number; x: number }>) => void
}

const VSSMeasureBlock = memo(function VSSMeasureBlock({
  measure,
  onAnchors,
}: VSSMeasureBlockProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const [downbeatX, setDownbeatX] = useState<number | null>(null)

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
      onAnchors(result.anchors)
      if (result.firstEventX !== undefined) setDownbeatX(result.firstEventX)
    } catch {
      // silently ignore VexFlow render errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="vss-measure">
      <div className="vss-notation-wrapper">
        {/* Orange downbeat arrow above beat 1, same as PlayAlong reel */}
        {downbeatX !== null && (
          <div
            className="pa-beat1-arrow"
            aria-hidden="true"
            style={{ left: downbeatX }}
          >
            ▼
          </div>
        )}
        <div ref={containerRef} className="pa-notation-container" />
      </div>
    </div>
  )
})
