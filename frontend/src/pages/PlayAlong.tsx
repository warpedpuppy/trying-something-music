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
  // Tap button is disabled until the first measure is fully visible on screen
  const [tapEnabled, setTapEnabled]     = useState(false)

  // DOM refs
  const tapBtnRef       = useRef<HTMLButtonElement>(null)
  const reelViewportRef = useRef<HTMLDivElement>(null)
  const reelTrackRef    = useRef<HTMLDivElement>(null)

  // Timing refs
  const reelStartRef   = useRef<number>(0)
  const reelElapsedRef = useRef<number>(0)
  // ↑ reelElapsedRef starts NEGATIVE — the reel begins off-screen right and
  //   scrolls in at BPM pace until elapsed reaches 0 (natural start position).
  //   No separate entry animation; a single unified BPM-speed scroll throughout.
  const bpmRef         = useRef<number>(DEFAULT_BPM)
  const stageRef       = useRef<Stage>('welcome')

  // BPM auto-progression refs
  const prevMeasureIndexRef = useRef<number>(-1)
  const bpmIncreaseAtRef    = useRef<number>(BPM_INCREASE_EVERY)
  const bpmNotifTimerRef    = useRef<number | null>(null)

  // Tap refs
  const tapTimesRef       = useRef<number[]>([])
  const hasFirstTappedRef = useRef<boolean>(false)

  // Misc refs
  const faceIdRef       = useRef<number>(0)
  const tapFlashTimer   = useRef<number | null>(null)
  const tapEnabledRef   = useRef<boolean>(false)   // mirrors tapEnabled without re-render cost

  // ── RAF-driven reel scroll ─────────────────────────────────────────────────
  //
  // reelElapsedRef starts negative. The reel is off-screen right when
  // elapsed < 0 (translateX is positive) and scrolls left at BPM pace.
  // elapsed crosses 0 exactly when the track reaches its natural start position,
  // then continues looping normally — one unbroken constant-speed motion.

  useEffect(() => {
    if (stage === 'welcome' || isPaused) return

    let rafId: number
    const frame = () => {
      const now          = performance.now()
      const msPerMeasure = (4 * 60_000) / bpmRef.current
      const loopMs       = REEL_UNIQUE * msPerMeasure
      const elapsed      = reelElapsedRef.current + (now - reelStartRef.current)

      // For negative elapsed don't loop — just use elapsed directly.
      // translateX(-negative) = translateX(positive) = off-screen right. ✓
      const raw      = elapsed < 0 ? elapsed : elapsed % loopMs
      const scrollPx = raw * (SLOT_PX / msPerMeasure)

      if (reelTrackRef.current) {
        reelTrackRef.current.style.transform = `translateX(${-scrollPx}px)`
      }

      // ── Enable tap button once the 4-beat count-in is complete ──────────
      // elapsed goes from -entryMs → 0 over the count-in period.
      // At elapsed ≥ 0 the first measure is fully on screen.
      if (!tapEnabledRef.current && elapsed >= 0) {
        tapEnabledRef.current = true
        setTapEnabled(true)
      }

      // ── Auto BPM progression (only while playing, elapsed > 0) ───────────
      if (stageRef.current === 'playing' && bpmRef.current < MAX_BPM && elapsed > 0) {
        const measureIndex = Math.floor(elapsed / msPerMeasure)
        if (measureIndex > prevMeasureIndexRef.current) {
          prevMeasureIndexRef.current = measureIndex
          if (measureIndex >= bpmIncreaseAtRef.current) {
            // Preserve reel scroll position at new tempo
            const newBpm     = bpmRef.current + 1
            const newMs      = (4 * 60_000) / newBpm
            const newElapsed = (scrollPx / SLOT_PX) * newMs
            reelElapsedRef.current    = newElapsed
            reelStartRef.current      = now
            bpmRef.current            = newBpm
            prevMeasureIndexRef.current = Math.floor(newElapsed / newMs)
            bpmIncreaseAtRef.current    = prevMeasureIndexRef.current + BPM_INCREASE_EVERY

            // Schedule React state updates
            setBpm(newBpm)
            setBpmNotif(newBpm)
            if (bpmNotifTimerRef.current) window.clearTimeout(bpmNotifTimerRef.current)
            bpmNotifTimerRef.current = window.setTimeout(() => setBpmNotif(null), 3500)
            tickEngine.cancelAll()
            tickEngine.startMetronome(newBpm, idx => setBeatIndex(idx % 4))
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

    // Entry = exactly 4 quarter-note beats at the starting BPM.
    // The reel scrolls one measure-width (SLOT_PX) during those 4 beats,
    // arriving at its natural start position (elapsed = 0) right on beat 5.
    // At that point the first measure is completely on screen.
    const msPerMeasure              = (4 * 60_000) / DEFAULT_BPM
    const entryMs                   = msPerMeasure   // 4 beats = 1 measure duration

    const now                       = performance.now()
    reelStartRef.current            = now
    reelElapsedRef.current          = -entryMs
    prevMeasureIndexRef.current     = -1
    bpmIncreaseAtRef.current        = BPM_INCREASE_EVERY
    hasFirstTappedRef.current       = false
    tapTimesRef.current             = []
    tapEnabledRef.current           = false
    setBeatIndex(null)
    setIsPaused(false)
    setHitNoteMap({})
    setBpmNotif(null)
    setTapEnabled(false)
    stageRef.current = 'scrolling'
    setStage('scrolling')

    // Start the metronome immediately so the user hears a 4-beat count-in
    // while the first measure scrolls onto the screen.
    tickEngine.startMetronome(DEFAULT_BPM, idx => setBeatIndex(idx % 4))
  }

  // ── Stop → back to Welcome ────────────────────────────────────────────────

  function stopPlaying() {
    tickEngine.cancelAll()
    bpmRef.current              = DEFAULT_BPM
    setBpm(DEFAULT_BPM)
    setBeatIndex(null)
    setIsPaused(false)
    hasFirstTappedRef.current   = false
    tapTimesRef.current         = []
    tapEnabledRef.current       = false
    prevMeasureIndexRef.current = -1
    bpmIncreaseAtRef.current    = BPM_INCREASE_EVERY
    setHitNoteMap({})
    setBpmNotif(null)
    setTapEnabled(false)
    stageRef.current = 'welcome'
    setStage('welcome')
  }

  // ── Pause / Resume ─────────────────────────────────────────────────────────

  function handlePause() {
    if (isPaused) {
      reelStartRef.current = performance.now()
      setIsPaused(false)
      // Metronome runs during both count-in (scrolling) and play phases.
      tickEngine.startMetronome(bpmRef.current, (index) => setBeatIndex(index % 4))
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

  // ── Shared: get cursor position in the reel ───────────────────────────────
  // Returns { measureIdx, posInMeasure, scrollPx } or null if cursor is before
  // the reel (reel hasn't arrived yet).

  function cursorPosition(): { measureIdx: number; posInMeasure: number; scrollPx: number } | null {
    const elapsed      = reelElapsedRef.current + (performance.now() - reelStartRef.current)
    const msPerMeasure = (4 * 60_000) / bpmRef.current
    const loopMs       = REEL_UNIQUE * msPerMeasure
    const raw          = elapsed < 0 ? elapsed : elapsed % loopMs
    const scrollPx     = raw * (SLOT_PX / msPerMeasure)

    const vpWidth    = reelViewportRef.current?.offsetWidth ?? window.innerWidth
    const reelPosPx  = vpWidth * 0.22 + scrollPx
    const rawIdx     = Math.floor(reelPosPx / SLOT_PX)
    if (rawIdx < 0) return null               // reel hasn't reached cursor yet

    return {
      measureIdx:   rawIdx % REEL_UNIQUE,
      posInMeasure: (reelPosPx % SLOT_PX) / SLOT_PX,
      scrollPx,
    }
  }

  // ── Tap accuracy — identify hit note, update hitNoteMap ───────────────────

  function checkTapAccuracy() {
    const pos = cursorPosition()
    if (!pos) return

    const { measureIdx, posInMeasure, scrollPx: _scrollPx } = pos
    const msPerMeasure = (4 * 60_000) / bpmRef.current
    const timeInMs     = posInMeasure * msPerMeasure
    const msPerBeat    = 60_000 / bpmRef.current

    const measure = REEL_LIBRARY[measureIdx]
    const onsets  = expectedOnsets({ events: measure.events })

    // Try metronome BPM first
    let hitEventIndex = -1
    for (const { eventIndex, beat } of onsets) {
      if (Math.abs(beat * msPerBeat - timeInMs) < HIT_WINDOW_MS) {
        hitEventIndex = eventIndex
        break
      }
    }

    // Pattern-match fallback: if user has drifted, try their detected BPM
    if (hitEventIndex === -1 && tapTimesRef.current.length >= 2) {
      const taps = tapTimesRef.current
      const avgInterval = (taps[taps.length - 1] - taps[0]) / (taps.length - 1)
      const userBpm = Math.max(30, Math.min(300, 60_000 / avgInterval))
      if (Math.abs(userBpm - bpmRef.current) > 4) {
        const userMsPerBeat     = 60_000 / userBpm
        const userMsPerMeasure  = userMsPerBeat * (measure.timeSigTop ?? 4)
        const userTimeInMs      = posInMeasure * userMsPerMeasure
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
    const vpW   = reelViewportRef.current?.offsetWidth ?? window.innerWidth
    const faceX = vpW * 0.22
    const faceY = rect ? rect.top + rect.height * 0.4 : window.innerHeight * 0.45
    const id    = ++faceIdRef.current
    setFaces(f => [...f, { id, type: hit ? 'hit' : 'miss', x: faceX, y: faceY }])
    window.setTimeout(() => setFaces(f => f.filter(x => x.id !== id)), 1300)

    // Mark note green
    if (hit) {
      setHitNoteMap(prev => {
        const existing = prev[measureIdx] ?? []
        if (existing.includes(hitEventIndex)) return prev
        return { ...prev, [measureIdx]: [...existing, hitEventIndex] }
      })
    }
  }

  // ── First-tap green: always green the nearest note at cursor ──────────────
  // The first tap is presumed to be the first note of whatever measure is
  // currently at the cursor — no timing window required.

  function greenFirstNote() {
    const pos = cursorPosition()
    // During entry the cursor is before the reel so pos may be null.
    // Fall back to measure 0, beat 0 — the user's first tap is assumed
    // to be the very first note of the reel.
    const measureIdx   = pos?.measureIdx ?? 0
    const msPerMeasure = (4 * 60_000) / bpmRef.current
    const timeInMs     = (pos?.posInMeasure ?? 0) * msPerMeasure
    const msPerBeat    = 60_000 / bpmRef.current

    const measure = REEL_LIBRARY[measureIdx]
    const onsets  = expectedOnsets({ events: measure.events })
    if (onsets.length === 0) return

    // If we have a real cursor position find the closest onset; otherwise
    // just take the first (beat 0) onset of the fallback measure.
    let targetEventIndex = onsets[0].eventIndex
    if (pos) {
      let closest = onsets[0]
      let closestDist = Math.abs(closest.beat * msPerBeat - timeInMs)
      for (const onset of onsets) {
        const d = Math.abs(onset.beat * msPerBeat - timeInMs)
        if (d < closestDist) { closest = onset; closestDist = d }
      }
      targetEventIndex = closest.eventIndex
    }

    setHitNoteMap(prev => {
      const existing = prev[measureIdx] ?? []
      if (existing.includes(targetEventIndex)) return prev
      return { ...prev, [measureIdx]: [...existing, targetEventIndex] }
    })
  }

  // ── Tap handler ────────────────────────────────────────────────────────────

  function handleTap() {
    if (isPaused || !tapEnabledRef.current) return

    tickEngine.tick('tap')
    setTapFlash(true)
    if (tapFlashTimer.current) window.clearTimeout(tapFlashTimer.current)
    tapFlashTimer.current = window.setTimeout(() => setTapFlash(false), 130)
    if (tapBtnRef.current) {
      const r = tapBtnRef.current.getBoundingClientRect()
      triggerRainbowBurst(r.left + r.width / 2, r.top + r.height / 2)
    }

    // Record tap time (used for pattern-match fallback)
    const now    = performance.now()
    const recent = tapTimesRef.current.filter(t => now - t < 4000)
    recent.push(now)
    tapTimesRef.current = recent

    if (!hasFirstTappedRef.current) {
      hasFirstTappedRef.current = true
      // Metronome already started in startScrolling(); just advance the stage.
      stageRef.current = 'playing'
      setStage('playing')
      // First tap = assumed to be the first note: green it unconditionally
      greenFirstNote()
      return
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
        : <p className="pa-tap-prompt">{tapEnabled ? 'Tap along!' : 'Listen…'}</p>
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
          className={`pa-tap-btn${tapFlash ? ' flash' : ''}${isPaused || !tapEnabled ? ' pa-tap-btn-muted' : ''}`}
          onPointerDown={e => { e.preventDefault(); handleTap() }}
          aria-label="Tap"
          disabled={isPaused || !tapEnabled}
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

const NotationBlock = memo(function NotationBlock({
  measure,
  onClick,
  hitNoteIndices,
}: NotationBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  /** eventIndex → SVG x position of the note head, captured once on mount. */
  const anchorsRef   = useRef<Map<number, number>>(new Map())

  // Render VexFlow once on mount and capture note-head x positions.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try {
      const result = renderPattern(
        el,
        { events: measure.events },
        measure.timeSigTop,
        measure.timeSigBottom,
        { fixedTotalWidth: SLOT_PX, showClef: measure.showClef, showTimeSignature: measure.showTimeSig, seamless: true },
      )
      const map = new Map<number, number>()
      result.anchors.forEach(a => map.set(a.eventIndex, a.x))
      anchorsRef.current = map
    } catch {
      // silently ignore render errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      {/* Wrapper gives a positioning context for the hit-dot overlay. */}
      <div className="pa-notation-wrapper">
        <div ref={containerRef} className="pa-notation-container" />
        {/* Green dots above correctly-tapped note heads. */}
        {hitNoteIndices && hitNoteIndices.length > 0 && (
          <div className="pa-dots-layer" aria-hidden="true">
            {hitNoteIndices.map(eventIdx => {
              const x = anchorsRef.current.get(eventIdx)
              return x !== undefined
                ? <div key={eventIdx} className="pa-hit-dot" style={{ left: x }} />
                : null
            })}
          </div>
        )}
      </div>
      <span className="pa-measure-hint">click to pause &amp; analyze</span>
      <div className="pa-measure-footer">
        <span className="pa-measure-label">{measure.label}</span>
        <span className="pa-measure-level" aria-label={`Level ${measure.level}`}>{levelDots}</span>
      </div>
    </div>
  )
})
