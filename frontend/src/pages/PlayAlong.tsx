import { useEffect, useRef, useState } from 'react'
import { renderPattern } from '../lib/vexflowPattern'
import { generateReel, type GeneratedMeasure } from '../lib/rhythmGenerator'
import { tickEngine } from '../lib/audio'
import { onsetTimesMs } from '../lib/rhythm'
import { RhythmPlayback } from '../components/RhythmPlayback'
import { usePageTitle } from '../hooks/usePageTitle'
import { triggerRainbowBurst } from '../lib/rippleEngine'

// ── Reel configuration ────────────────────────────────────────────────────────

const SLOT_PX = 380          // fixed pixel width of every rendered measure
const REEL_UNIQUE = 24       // how many unique measures to generate before looping
const DEFAULT_BPM = 40       // tempo before user establishes their own
const ENTRY_DURATION_MS = 1400  // ms for the reel to scroll in from off-screen right

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

  // DOM refs
  const tapBtnRef      = useRef<HTMLButtonElement>(null)
  const reelViewportRef = useRef<HTMLDivElement>(null)
  const reelTrackRef   = useRef<HTMLDivElement>(null)

  // Timing refs (never trigger re-renders)
  const reelStartRef   = useRef<number>(0)       // wall clock of last start/resume
  const reelElapsedRef = useRef<number>(0)        // accumulated ms before last pause
  const bpmRef         = useRef<number>(DEFAULT_BPM)  // mirrors bpm state for RAF / closures
  const entryStartRef  = useRef<number>(0)        // wall clock when reel entered screen

  // Tap-tempo refs
  const tapTimesRef       = useRef<number[]>([])  // timestamps of recent taps
  const hasFirstTappedRef = useRef<boolean>(false)

  // Misc refs
  const faceIdRef      = useRef<number>(0)
  const tapFlashTimer  = useRef<number | null>(null)

  // ── RAF-driven reel scroll ─────────────────────────────────────────────────
  // Runs whenever the reel is active (not welcome, not paused).
  // Uses bpmRef so BPM changes take effect immediately without remounting.

  useEffect(() => {
    if (stage === 'welcome' || isPaused) return

    let rafId: number
    const frame = () => {
      const elapsed      = reelElapsedRef.current + (performance.now() - reelStartRef.current)
      const msPerMeasure = (4 * 60_000) / bpmRef.current
      const loopMs       = REEL_UNIQUE * msPerMeasure
      const scrollPx     = (elapsed % loopMs) * (SLOT_PX / msPerMeasure)

      // Entry offset: reel slides in from off-screen right over ENTRY_DURATION_MS
      const entryElapsed  = performance.now() - entryStartRef.current
      const entryFraction = Math.min(entryElapsed / ENTRY_DURATION_MS, 1)
      // easeOutCubic so it decelerates as it arrives
      const entryEased    = 1 - Math.pow(1 - entryFraction, 3)
      const entryOffset   = (1 - entryEased) * window.innerWidth

      if (reelTrackRef.current) {
        reelTrackRef.current.style.transform = `translateX(${-scrollPx + entryOffset}px)`
      }
      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [stage, isPaused])

  // ── BPM update — preserves reel position when tempo changes ──────────────

  function applyNewBpm(newBpm: number) {
    const elapsed       = reelElapsedRef.current + (performance.now() - reelStartRef.current)
    const oldMs         = (4 * 60_000) / bpmRef.current
    const scrollPx      = (elapsed % (REEL_UNIQUE * oldMs)) * (SLOT_PX / oldMs)
    const newMs         = (4 * 60_000) / newBpm
    // Invert: what elapsed time produces this scrollPx at the new tempo?
    const newElapsed    = (scrollPx / SLOT_PX) * newMs

    reelElapsedRef.current = newElapsed
    reelStartRef.current   = performance.now()
    bpmRef.current         = newBpm
    setBpm(newBpm)
  }

  // ── Start (Welcome → Scrolling) ────────────────────────────────────────────

  function startScrolling() {
    tickEngine.cancelAll()
    bpmRef.current            = DEFAULT_BPM
    setBpm(DEFAULT_BPM)
    const now                 = performance.now()
    reelStartRef.current      = now
    reelElapsedRef.current    = 0
    entryStartRef.current     = now   // reel slides in from off-screen right
    hasFirstTappedRef.current = false
    tapTimesRef.current       = []
    setBeatIndex(null)
    setIsPaused(false)
    setStage('scrolling')
  }

  // ── Stop → back to Welcome ────────────────────────────────────────────────

  function stopPlaying() {
    tickEngine.cancelAll()
    setBeatIndex(null)
    setIsPaused(false)
    hasFirstTappedRef.current = false
    tapTimesRef.current = []
    setStage('welcome')
  }

  // ── Pause / Resume ─────────────────────────────────────────────────────────

  function handlePause() {
    if (isPaused) {
      // Resume
      reelStartRef.current = performance.now()
      setIsPaused(false)
      if (stage === 'playing') {
        tickEngine.startMetronome(bpmRef.current, (index) => setBeatIndex(index % 4))
      }
    } else {
      // Pause — freeze elapsed time
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

  // ── Tap accuracy check ────────────────────────────────────────────────────

  function checkTapAccuracy() {
    const elapsed      = reelElapsedRef.current + (performance.now() - reelStartRef.current)
    if (elapsed < 0) return

    const msPerMeasure = (4 * 60_000) / bpmRef.current
    const loopMs       = REEL_UNIQUE * msPerMeasure
    const scrollPx     = (elapsed % loopMs) * (SLOT_PX / msPerMeasure)

    // Cursor is at 22% of the viewport width
    const cursorLeft   = window.innerWidth * 0.22
    const reelPosPx    = cursorLeft + scrollPx
    const measureIdx   = Math.floor(reelPosPx / SLOT_PX) % REEL_UNIQUE
    const posInMeasure = (reelPosPx % SLOT_PX) / SLOT_PX
    const timeInMs     = posInMeasure * msPerMeasure

    const measure = REEL_LIBRARY[measureIdx]
    const onsets  = onsetTimesMs({ events: measure.events }, bpmRef.current)
    const HIT_WINDOW_MS = 165
    const hit = onsets.some(t => Math.abs(t - timeInMs) < HIT_WINDOW_MS)

    const vpEl  = reelViewportRef.current
    const rect  = vpEl?.getBoundingClientRect()
    const faceX = window.innerWidth * 0.22
    const faceY = rect ? rect.top + rect.height * 0.4 : window.innerHeight * 0.45
    const id    = ++faceIdRef.current

    setFaces(f => [...f, { id, type: hit ? 'hit' : 'miss', x: faceX, y: faceY }])
    window.setTimeout(() => setFaces(f => f.filter(x => x.id !== id)), 1300)
  }

  // ── Tap handler ────────────────────────────────────────────────────────────

  function handleTap() {
    if (isPaused) return

    // Sound + flash + burst
    tickEngine.tick('tap')
    setTapFlash(true)
    if (tapFlashTimer.current) window.clearTimeout(tapFlashTimer.current)
    tapFlashTimer.current = window.setTimeout(() => setTapFlash(false), 130)
    if (tapBtnRef.current) {
      const r = tapBtnRef.current.getBoundingClientRect()
      triggerRainbowBurst(r.left + r.width / 2, r.top + r.height / 2)
    }

    // Tap tempo — keep only taps within the last 4 seconds
    const now    = performance.now()
    const recent = tapTimesRef.current.filter(t => now - t < 4000)
    recent.push(now)
    tapTimesRef.current = recent

    if (!hasFirstTappedRef.current) {
      // First tap ever: start metronome at current (default) tempo, go to playing
      hasFirstTappedRef.current = true
      tickEngine.startMetronome(bpmRef.current, (index) => setBeatIndex(index % 4))
      setStage('playing')
      return   // no accuracy check yet — BPM not established by user
    }

    // Update BPM from tap intervals
    if (recent.length >= 2) {
      const avg          = (recent[recent.length - 1] - recent[0]) / (recent.length - 1)
      const detectedBpm  = Math.max(40, Math.min(200, Math.round(60_000 / avg)))

      if (Math.abs(detectedBpm - bpmRef.current) > 3) {
        applyNewBpm(detectedBpm)
        // Restart metronome at new tempo
        tickEngine.cancelAll()
        tickEngine.startMetronome(detectedBpm, (index) => setBeatIndex(index % 4))
      }
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

      {/* ── Scrolling notation reel ───────────────────────────────────── */}
      <div
        className="pa-reel-viewport"
        ref={reelViewportRef}
      >
        {/* Cursor / downbeat line */}
        <div
          key={beatIndex ?? -1}
          className={`pa-cursor-line${beatIndex !== null ? ' pa-cursor-pulse' : ''}`}
          aria-hidden="true"
        />

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
        Sheet music scrolls in from the right. Tap along — your tapping speed
        sets the tempo, and the beat follows you.
      </p>
      <ul className="pa-welcome-bullets">
        <li>Watch the notation scroll by</li>
        <li>Tap the big button in time with the notes</li>
        <li>Your tapping pace becomes the metronome tempo</li>
        <li>Tap faster or slower at any time to adjust</li>
        <li>Click any measure to pause and hear it explained</li>
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
}

function NotationBlock({ measure, onClick }: NotationBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

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
      // silently ignore render errors (e.g. in test environments)
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
      <div ref={containerRef} className="pa-notation-container" />
      <span className="pa-measure-hint">click to pause &amp; analyze</span>
      <div className="pa-measure-footer">
        <span className="pa-measure-label">{measure.label}</span>
        <span className="pa-measure-level" aria-label={`Level ${measure.level}`}>{levelDots}</span>
      </div>
    </div>
  )
}
