import { memo, useEffect, useRef, useState } from 'react'
import { renderPattern } from '../lib/vexflowPattern'
import { generateReel, type GeneratedMeasure } from '../lib/rhythmGenerator'
import { tickEngine } from '../lib/audio'
import { expectedOnsets } from '../lib/rhythm'
import { RhythmPlayback } from '../components/RhythmPlayback'
import { usePageTitle } from '../hooks/usePageTitle'
import { triggerRainbowBurst } from '../lib/rippleEngine'

// ── Reel configuration ────────────────────────────────────────────────────────

const SLOT_PX            = 380   // fixed pixel width of every rendered measure
const REEL_UNIQUE        = 24    // how many unique measures before looping
const DEFAULT_BPM        = 40    // starting tempo
const MAX_BPM            = 80    // auto-increase ceiling
const BPM_INCREASE_EVERY = 100   // measures between auto BPM bumps
const HIT_WINDOW_MS      = 175   // tap-accuracy tolerance (ms)

// Entry sweep: content rushes in from off-screen right at V_ENTRY_INIT px/ms,
// decelerating quadratically to match the BPM scroll speed exactly on arrival —
// so there is zero velocity discontinuity when the scroll phase takes over.
const V_ENTRY_INIT = 0.3         // px/ms (300 px/s) — initial sweep speed

// Built once at module load — deterministic, no re-generation on re-render
const REEL_LIBRARY: GeneratedMeasure[] = generateReel(REEL_UNIQUE, 1337)
// Doubled for seamless looping
const REEL: GeneratedMeasure[] = [...REEL_LIBRARY, ...REEL_LIBRARY]

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'welcome' | 'scrolling' | 'playing'
type TapFace = { id: number; type: 'hit' | 'miss'; x: number; y: number }

// ── Main component ────────────────────────────────────────────────────────────

export function PlayAlong() {
  usePageTitle('Play Along')

  const [stage, setStage]               = useState<Stage>('welcome')
  const [bpm, setBpm]                   = useState(DEFAULT_BPM)
  const [beatIndex, setBeatIndex]       = useState<number | null>(null)
  const [tapFlash, setTapFlash]         = useState(false)
  const [isPaused, setIsPaused]         = useState(false)
  const [reviewMeasure, setReviewMeasure] = useState<GeneratedMeasure | null>(null)
  const [faces, setFaces]               = useState<TapFace[]>([])
  const [bpmNotif, setBpmNotif]         = useState<number | null>(null)
  // Map from reel measure index (0-REEL_UNIQUE) to array of hit event indices
  const [hitNoteMap, setHitNoteMap]     = useState<Record<number, number[]>>({})

  // DOM refs
  const tapBtnRef       = useRef<HTMLButtonElement>(null)
  const reelViewportRef = useRef<HTMLDivElement>(null)
  const reelTrackRef    = useRef<HTMLDivElement>(null)

  // Timing refs (never trigger re-renders)
  const reelStartRef   = useRef<number>(0)
  const reelElapsedRef = useRef<number>(0)
  const bpmRef         = useRef<number>(DEFAULT_BPM)
  const stageRef       = useRef<Stage>('welcome')   // mirrors stage for RAF closures

  // Entry-animation refs — quadratic sweep from off-screen right to position 0
  const entryStartRef  = useRef<number>(0)
  const entryDurRef    = useRef<number>(0)
  const entryARef      = useRef<number>(0)
  const entryBRef      = useRef<number>(0)
  const entryP0Ref     = useRef<number>(0)

  // BPM auto-progression refs
  const prevMeasureIndexRef  = useRef<number>(-1)
  const bpmIncreaseAtRef     = useRef<number>(BPM_INCREASE_EVERY)
  const bpmNotifTimerRef     = useRef<number | null>(null)

  // Tap refs
  const tapTimesRef       = useRef<number[]>([])
  const hasFirstTappedRef = useRef<boolean>(false)

  // Misc refs
  const faceIdRef     = useRef<number>(0)
  const tapFlashTimer = useRef<number | null>(null)

  // ── RAF-driven reel scroll ─────────────────────────────────────────────────

  useEffect(() => {
    if (stage === 'welcome' || isPaused) return

    let rafId: number
    const frame = () => {
      const now          = performance.now()
      const msPerMeasure = (4 * 60_000) / bpmRef.current
      const loopMs       = REEL_UNIQUE * msPerMeasure
      const entryElapsed = now - entryStartRef.current

      if (entryElapsed < entryDurRef.current) {
        // ── Entry phase: quadratic sweep from off-screen right ────────────
        const t   = entryElapsed
        const pos = entryARef.current * t * t + entryBRef.current * t + entryP0Ref.current
        if (reelTrackRef.current) {
          reelTrackRef.current.style.transform = `translateX(${pos}px)`
        }
        reelStartRef.current   = now
        reelElapsedRef.current = 0

      } else {
        // ── Scroll phase: BPM-driven left scroll ─────────────────────────
        const elapsed  = reelElapsedRef.current + (now - reelStartRef.current)
        const scrollPx = (elapsed % loopMs) * (SLOT_PX / msPerMeasure)
        if (reelTrackRef.current) {
          reelTrackRef.current.style.transform = `translateX(-${scrollPx}px)`
        }

        // ── Auto BPM progression (only while playing, BPM < max) ─────────
        if (stageRef.current === 'playing' && bpmRef.current < MAX_BPM) {
          const measureIndex = Math.floor(elapsed / msPerMeasure)
          if (measureIndex > prevMeasureIndexRef.current) {
            prevMeasureIndexRef.current = measureIndex
            if (measureIndex >= bpmIncreaseAtRef.current) {
              // Preserve reel position at new tempo
              const oldScrollPx = scrollPx
              const newBpm      = bpmRef.current + 1
              const newMs       = (4 * 60_000) / newBpm
              const newElapsed  = (oldScrollPx / SLOT_PX) * newMs
              reelElapsedRef.current = newElapsed
              reelStartRef.current   = now
              bpmRef.current         = newBpm

              // Next threshold (based on new measure count at new tempo)
              prevMeasureIndexRef.current = Math.floor(newElapsed / newMs)
              bpmIncreaseAtRef.current    = prevMeasureIndexRef.current + BPM_INCREASE_EVERY

              // Schedule React state updates (batched)
              setBpm(newBpm)
              setBpmNotif(newBpm)
              if (bpmNotifTimerRef.current) window.clearTimeout(bpmNotifTimerRef.current)
              bpmNotifTimerRef.current = window.setTimeout(() => setBpmNotif(null), 3500)
              tickEngine.cancelAll()
              tickEngine.startMetronome(newBpm, idx => setBeatIndex(idx % 4))
            }
          }
        }
      }

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [stage, isPaused])


  // ── Start (Welcome → Scrolling) ────────────────────────────────────────────

  function startScrolling() {
    tickEngine.cancelAll()
    bpmRef.current = DEFAULT_BPM
    setBpm(DEFAULT_BPM)

    const vpWidth      = window.innerWidth
    const msPerMeasure = (4 * 60_000) / DEFAULT_BPM
    const vScroll      = SLOT_PX / msPerMeasure
    const T            = 2 * vpWidth / (V_ENTRY_INIT + vScroll)
    const a            = (V_ENTRY_INIT - vScroll) / (2 * T)
    const b            = -V_ENTRY_INIT

    const now                  = performance.now()
    entryStartRef.current      = now
    entryDurRef.current        = T
    entryARef.current          = a
    entryBRef.current          = b
    entryP0Ref.current         = vpWidth
    reelStartRef.current       = now
    reelElapsedRef.current     = 0
    prevMeasureIndexRef.current  = -1
    bpmIncreaseAtRef.current     = BPM_INCREASE_EVERY
    hasFirstTappedRef.current  = false
    tapTimesRef.current        = []
    setBeatIndex(null)
    setIsPaused(false)
    setHitNoteMap({})
    setBpmNotif(null)
    stageRef.current = 'scrolling'
    setStage('scrolling')
  }

  // ── Stop → back to Welcome ────────────────────────────────────────────────

  function stopPlaying() {
    tickEngine.cancelAll()
    setBeatIndex(null)
    setIsPaused(false)
    hasFirstTappedRef.current  = false
    tapTimesRef.current        = []
    prevMeasureIndexRef.current = -1
    bpmIncreaseAtRef.current    = BPM_INCREASE_EVERY
    bpmRef.current              = DEFAULT_BPM
    setBpm(DEFAULT_BPM)
    setHitNoteMap({})
    setBpmNotif(null)
    stageRef.current = 'welcome'
    setStage('welcome')
  }

  // ── Pause / Resume ─────────────────────────────────────────────────────────

  function handlePause() {
    if (isPaused) {
      reelStartRef.current = performance.now()
      setIsPaused(false)
      if (stageRef.current === 'playing') {
        tickEngine.startMetronome(bpmRef.current, (index) => setBeatIndex(index % 4))
      }
    } else {
      reelElapsedRef.current += performance.now() - reelStartRef.current
      setIsPaused(true)
      tickEngine.cancelAll()
      setBeatIndex(null)
    }
  }

  // ── Measure click → review modal ──────────────────────────────────────────

  function handleMeasureClick(measure: GeneratedMeasure) {
    if (!isPaused) {
      reelElapsedRef.current += performance.now() - reelStartRef.current
      setIsPaused(true)
      tickEngine.cancelAll()
      setBeatIndex(null)
    }
    setReviewMeasure(measure)
  }

  // ── Tap accuracy — identify hit note, update hitNoteMap ───────────────────

  function checkTapAccuracy() {
    const elapsed = reelElapsedRef.current + (performance.now() - reelStartRef.current)
    if (elapsed < 0) return

    const msPerMeasure = (4 * 60_000) / bpmRef.current
    const loopMs       = REEL_UNIQUE * msPerMeasure
    const scrollPx     = (elapsed % loopMs) * (SLOT_PX / msPerMeasure)

    const vpWidth      = reelViewportRef.current?.offsetWidth ?? window.innerWidth
    const cursorLeft   = vpWidth * 0.22
    const reelPosPx    = cursorLeft + scrollPx
    const measureIdx   = Math.floor(reelPosPx / SLOT_PX) % REEL_UNIQUE
    const posInMeasure = (reelPosPx % SLOT_PX) / SLOT_PX
    const timeInMs     = posInMeasure * msPerMeasure

    const measure  = REEL_LIBRARY[measureIdx]
    const onsets   = expectedOnsets({ events: measure.events })
    const msPerBeat = 60_000 / bpmRef.current

    // Try metronome BPM first
    let hitEventIndex = -1
    for (const { eventIndex, beat } of onsets) {
      if (Math.abs(beat * msPerBeat - timeInMs) < HIT_WINDOW_MS) {
        hitEventIndex = eventIndex
        break
      }
    }

    // Pattern-match fallback: if user has drifted, use their tapping tempo
    if (hitEventIndex === -1 && tapTimesRef.current.length >= 2) {
      const taps = tapTimesRef.current
      const avgInterval = (taps[taps.length - 1] - taps[0]) / (taps.length - 1)
      const userBpm = Math.max(30, Math.min(300, 60_000 / avgInterval))
      if (Math.abs(userBpm - bpmRef.current) > 4) {
        const userMsPerBeat  = 60_000 / userBpm
        const userMsPerMeasure = userMsPerBeat * (measure.timeSigTop ?? 4)
        const userTimeInMs   = posInMeasure * userMsPerMeasure
        for (const { eventIndex, beat } of onsets) {
          if (Math.abs(beat * userMsPerBeat - userTimeInMs) < HIT_WINDOW_MS) {
            hitEventIndex = eventIndex
            break
          }
        }
      }
    }

    const hit = hitEventIndex >= 0

    // Emoji feedback
    const vpEl  = reelViewportRef.current
    const rect  = vpEl?.getBoundingClientRect()
    const faceX = vpWidth * 0.22
    const faceY = rect ? rect.top + rect.height * 0.4 : window.innerHeight * 0.45
    const id    = ++faceIdRef.current
    setFaces(f => [...f, { id, type: hit ? 'hit' : 'miss', x: faceX, y: faceY }])
    window.setTimeout(() => setFaces(f => f.filter(x => x.id !== id)), 1300)

    // Mark note green
    if (hit) {
      setHitNoteMap(prev => {
        const existing = prev[measureIdx] ?? []
        if (existing.includes(hitEventIndex)) return prev   // already hit, skip re-render
        return { ...prev, [measureIdx]: [...existing, hitEventIndex] }
      })
    }
  }

  // ── Tap handler ────────────────────────────────────────────────────────────

  function handleTap() {
    if (isPaused) return

    tickEngine.tick('tap')
    setTapFlash(true)
    if (tapFlashTimer.current) window.clearTimeout(tapFlashTimer.current)
    tapFlashTimer.current = window.setTimeout(() => setTapFlash(false), 130)
    if (tapBtnRef.current) {
      const r = tapBtnRef.current.getBoundingClientRect()
      triggerRainbowBurst(r.left + r.width / 2, r.top + r.height / 2)
    }

    // Record tap time (used for pattern-match fallback in checkTapAccuracy)
    const now    = performance.now()
    const recent = tapTimesRef.current.filter(t => now - t < 4000)
    recent.push(now)
    tapTimesRef.current = recent

    if (!hasFirstTappedRef.current) {
      hasFirstTappedRef.current = true
      tickEngine.startMetronome(bpmRef.current, (index) => setBeatIndex(index % 4))
      stageRef.current = 'playing'
      setStage('playing')
      return   // no accuracy check on first tap
    }

    checkTapAccuracy()
  }

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => { tickEngine.cancelAll() }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  if (stage === 'welcome') return <WelcomeScreen onStart={startScrolling} />

  return (
    <div className="pa-playing">

      {/* ── Measure review modal ──────────────────────────────────────── */}
      {reviewMeasure && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setReviewMeasure(null) }}
        >
          <div className="modal-panel">
            <div className="modal-header">
              <h2 className="modal-title">Hear this measure</h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setReviewMeasure(null)}
              >✕</button>
            </div>
            <RhythmPlayback
              pattern={{ events: reviewMeasure.events }}
              timeSigTop={reviewMeasure.timeSigTop}
              timeSigBottom={reviewMeasure.timeSigBottom}
              bpm={bpm}
              onClose={() => setReviewMeasure(null)}
            />
          </div>
        </div>
      )}

      {/* ── Beat indicator dots ────────────────────────────────────────── */}
      <div className="pa-beat-row" aria-label="Beat indicator">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`pa-beat-dot${beatIndex === i ? ' active' : ''}`} />
        ))}
      </div>

      {/* ── Tempo / prompt label ──────────────────────────────────────── */}
      {stage === 'playing'
        ? <p className="pa-bpm-label">{bpm} BPM</p>
        : <p className="pa-tap-prompt">Tap the button to begin</p>
      }

      {/* ── Auto BPM increase notification ───────────────────────────── */}
      {bpmNotif && (
        <div className="pa-bpm-notif" aria-live="polite">
          ♩ = {bpmNotif} — tempo up!
        </div>
      )}

      {/* ── Scrolling notation reel ───────────────────────────────────── */}
      <div
        className="pa-reel-viewport"
        ref={reelViewportRef}
      >
        {/* Reel track — position driven by RAF, not CSS animation */}
        <div
          ref={reelTrackRef}
          className="pa-reel-track"
          style={{ width: `${REEL.length * SLOT_PX}px` }}
        >
          {REEL.map((item, i) => (
            <NotationBlock
              key={i}
              measure={item}
              onClick={() => handleMeasureClick(item)}
              hitNoteIndices={hitNoteMap[i % REEL_UNIQUE]}
            />
          ))}
        </div>
      </div>

      {/* ── TAP button ───────────────────────────────────────────────── */}
      <div className="pa-controls-row">
        <button
          ref={tapBtnRef}
          type="button"
          className={`pa-tap-btn${tapFlash ? ' flash' : ''}${isPaused ? ' pa-tap-btn-muted' : ''}`}
          onPointerDown={e => { e.preventDefault(); handleTap() }}
          aria-label="Tap"
          disabled={isPaused}
        >
          <span className="pa-tap-btn-label">TAP</span>
          <span className="pa-tap-btn-ring" aria-hidden="true" />
        </button>
      </div>

      {/* ── Secondary controls ────────────────────────────────────────── */}
      <div className="pa-secondary-controls">
        {stage === 'playing' && (
          <button
            type="button"
            className={`pa-pause-btn${isPaused ? ' active' : ''}`}
            onClick={handlePause}
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
        )}
        <button type="button" className="pa-stop-btn-pill" onClick={stopPlaying}>
          ■ Stop
        </button>
      </div>

      {/* ── Tap-accuracy emoji faces ──────────────────────────────────── */}
      {faces.map(f => (
        <span
          key={f.id}
          className={`pa-face pa-face-${f.type}`}
          style={{ left: f.x, top: f.y }}
          aria-hidden="true"
        >
          {f.type === 'hit' ? '😊' : '😞'}
        </span>
      ))}

    </div>
  )
}

// ── Welcome screen ────────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="pa-stage pa-welcome">
      <h1 className="pa-welcome-title">Play Along</h1>
      <p className="pa-welcome-body">
        Sheet music scrolls in from the right. Tap along in time with the notes —
        each note you hit turns green.
      </p>
      <ul className="pa-welcome-bullets">
        <li>Watch the notation scroll toward you from the right</li>
        <li>Tap the big button each time a note passes by</li>
        <li>Notes you tap in time turn green</li>
        <li>If you drift, just keep tapping your own rhythm — we'll still match you</li>
        <li>Tempo starts at 40 BPM and rises by 1 every 100 measures, up to 80 BPM</li>
        <li>Tap any measure to pause and hear it played back</li>
      </ul>
      <button type="button" className="btn-primary pa-cta" onClick={onStart}>
        Start
      </button>
    </div>
  )
}

// ── Notation block ────────────────────────────────────────────────────────────

interface NotationBlockProps {
  measure: GeneratedMeasure
  onClick: () => void
  hitNoteIndices?: number[]
}

const NOTE_HIT_COLOR = '#16a34a'   // green-700 — readable on white staff background

const NotationBlock = memo(function NotationBlock({
  measure,
  onClick,
  hitNoteIndices,
}: NotationBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Render VexFlow once on mount
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try {
      renderPattern(el, { events: measure.events }, measure.timeSigTop, measure.timeSigBottom, {
        fixedTotalWidth: SLOT_PX,
        showClef: measure.showClef,
        showTimeSignature: measure.showTimeSig,
        seamless: true,
      })
    } catch {
      // silently ignore render errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Color hit note heads green whenever hitNoteIndices changes
  useEffect(() => {
    if (!containerRef.current || !hitNoteIndices || hitNoteIndices.length === 0) return
    const noteGroups = containerRef.current.querySelectorAll('.vf-stavenote')
    hitNoteIndices.forEach(eventIndex => {
      const group = noteGroups[eventIndex]
      if (!group) return
      // Color every filled SVG shape inside this note group
      group.querySelectorAll<SVGElement>('[fill]:not([fill="none"])').forEach(el => {
        el.setAttribute('fill', NOTE_HIT_COLOR)
      })
      // Also color stroked elements (e.g. stems, beams rendered with stroke)
      group.querySelectorAll<SVGElement>('[stroke]:not([stroke="none"])').forEach(el => {
        el.setAttribute('stroke', NOTE_HIT_COLOR)
      })
    })
  }, [hitNoteIndices])

  const levelDots = '●'.repeat(measure.level) + '○'.repeat(5 - measure.level)

  return (
    <div
      className="pa-measure-block"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-label={`Hear measure: ${measure.label}`}
    >
      <div ref={containerRef} className="pa-notation-container" />
      <span className="pa-measure-hint">click to pause &amp; analyze</span>
      <div className="pa-measure-footer">
        <span className="pa-measure-label">{measure.label}</span>
        <span className="pa-measure-level" aria-label={`Level ${measure.level}`}>{levelDots}</span>
      </div>
    </div>
  )
})
