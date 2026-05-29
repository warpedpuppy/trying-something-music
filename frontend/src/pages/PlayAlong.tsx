import { useCallback, useEffect, useRef, useState } from 'react'
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

// Build once at module load — deterministic, no re-generation on re-render
const REEL_LIBRARY: GeneratedMeasure[] = generateReel(REEL_UNIQUE, 1337)
// Double for seamless CSS loop
const REEL: GeneratedMeasure[] = [...REEL_LIBRARY, ...REEL_LIBRARY]

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'welcome' | 'bpm-setup' | 'playing'
type TapFace = { id: number; type: 'hit' | 'miss'; x: number; y: number }

// ── Main component ────────────────────────────────────────────────────────────

export function PlayAlong() {
  usePageTitle('Play Along')
  const [stage, setStage] = useState<Stage>('welcome')
  const [bpm, setBpm] = useState(80)
  const [beatIndex, setBeatIndex] = useState<number | null>(null)
  const [tapFlash, setTapFlash] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [reviewMeasure, setReviewMeasure] = useState<GeneratedMeasure | null>(null)
  const [faces, setFaces] = useState<TapFace[]>([])
  const tapFlashTimer = useRef<number | null>(null)
  const tapBtnRef = useRef<HTMLButtonElement>(null)
  const reelViewportRef = useRef<HTMLDivElement>(null)
  // Reel elapsed-time tracking (needed for tap accuracy)
  const reelStartRef = useRef<number>(0)      // wall clock when last started/resumed
  const reelElapsedRef = useRef<number>(0)    // accumulated elapsed before last pause
  const faceIdRef = useRef<number>(0)

  const msPerMeasure = (4 * 60000) / bpm
  const reelDurationMs = REEL_UNIQUE * msPerMeasure

  function startPlaying() {
    tickEngine.cancelAll()
    tickEngine.startMetronome(bpm, (index) => setBeatIndex(index % 4))
    reelStartRef.current = performance.now()
    reelElapsedRef.current = 0
    setIsPaused(false)
    setStage('playing')
  }

  function stopPlaying() {
    tickEngine.cancelAll()
    setBeatIndex(null)
    setIsPaused(false)
    setStage('bpm-setup')
  }

  function handlePause() {
    if (isPaused) {
      // Resume — record new start without resetting accumulated elapsed
      reelStartRef.current = performance.now()
      setIsPaused(false)
      tickEngine.startMetronome(bpm, (index) => setBeatIndex(index % 4))
    } else {
      // Pause — accumulate elapsed time
      reelElapsedRef.current += performance.now() - reelStartRef.current
      setIsPaused(true)
      tickEngine.cancelAll()
      setBeatIndex(null)
    }
  }

  function handleMeasureClick(measure: GeneratedMeasure) {
    // Pause the game if it's still running, then open the review modal.
    if (!isPaused) {
      setIsPaused(true)
      tickEngine.cancelAll()
      setBeatIndex(null)
    }
    setReviewMeasure(measure)
  }

  function checkTapAccuracy() {
    // Total reel elapsed ms (accounts for pauses)
    const elapsed = reelElapsedRef.current + (performance.now() - reelStartRef.current)
    if (elapsed < 0) return

    const tmod = elapsed % reelDurationMs
    const pxPerMs = SLOT_PX / msPerMeasure
    const scrollPx = tmod * pxPerMs

    // Cursor line sits at 22% of the viewport width
    const cursorLeft = window.innerWidth * 0.22
    const reelPosPx = cursorLeft + scrollPx

    const measureIdx = Math.floor(reelPosPx / SLOT_PX) % REEL_UNIQUE
    const posInMeasure = (reelPosPx % SLOT_PX) / SLOT_PX
    const timeInMeasureMs = posInMeasure * msPerMeasure

    const measure = REEL_LIBRARY[measureIdx]
    const onsets = onsetTimesMs({ events: measure.events }, bpm)

    const HIT_WINDOW_MS = 165
    const hit = onsets.some(t => Math.abs(t - timeInMeasureMs) < HIT_WINDOW_MS)

    // Find face spawn position: center on cursor, vertically inside the reel viewport
    const vpEl = reelViewportRef.current
    const rect = vpEl?.getBoundingClientRect()
    const faceX = window.innerWidth * 0.22
    const faceY = rect ? rect.top + rect.height * 0.4 : window.innerHeight * 0.45

    const id = ++faceIdRef.current
    setFaces(f => [...f, { id, type: hit ? 'hit' : 'miss', x: faceX, y: faceY }])
    window.setTimeout(() => setFaces(f => f.filter(x => x.id !== id)), 1300)
  }

  function handleTap() {
    tickEngine.tick('tap')
    setTapFlash(true)
    if (tapFlashTimer.current) window.clearTimeout(tapFlashTimer.current)
    tapFlashTimer.current = window.setTimeout(() => setTapFlash(false), 130)
    if (tapBtnRef.current) {
      const r = tapBtnRef.current.getBoundingClientRect()
      triggerRainbowBurst(r.left + r.width / 2, r.top + r.height / 2)
    }
    checkTapAccuracy()
  }

  useEffect(() => () => { tickEngine.cancelAll() }, [])

  if (stage === 'welcome') return <WelcomeScreen onStart={() => setStage('bpm-setup')} />
  if (stage === 'bpm-setup') return <BpmSetup bpm={bpm} setBpm={setBpm} onStart={startPlaying} />

  return (
    <div className="pa-playing">
      {/* Review modal — same RhythmPlayback component used in ExercisePlayer */}
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
              >
                ✕
              </button>
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

      {/* Beat dots */}
      <div className="pa-beat-row" aria-label="Beat indicator">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`pa-beat-dot${beatIndex === i ? ' active' : ''}`} />
        ))}
      </div>
      <p className="pa-bpm-label">{bpm} BPM</p>

      {/* Scrolling notation reel */}
      <div className="pa-reel-viewport" ref={reelViewportRef}>
        <div
          key={beatIndex ?? -1}
          className={`pa-cursor-line${beatIndex !== null ? ' pa-cursor-pulse' : ''}`}
          aria-hidden="true"
        />
        <div
          className={`pa-reel-track${isPaused ? ' paused' : ''}`}
          style={{
            width: `${REEL.length * SLOT_PX}px`,
            animationDuration: `${reelDurationMs}ms`,
          }}
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

      {/* Controls row */}
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

      <div className="pa-secondary-controls">
        <button
          type="button"
          className={`pa-pause-btn${isPaused ? ' active' : ''}`}
          onClick={handlePause}
          aria-label={isPaused ? 'Resume' : 'Pause'}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button type="button" className="pa-stop-btn-pill" onClick={stopPlaying}>
          ■ Stop
        </button>
      </div>

      {/* Floating tap-accuracy faces (fixed position, outside reel clipping) */}
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
        Sheet music scrolls past from right to left — tap along with the metronome.
        No pressure, no score: just feel the rhythm.
      </p>
      <ul className="pa-welcome-bullets">
        <li>Pick a tempo that feels comfortable</li>
        <li>Watch the notation scroll by</li>
        <li>Tap the big button on every note</li>
        <li>Patterns get gradually more challenging — and the time signature changes!</li>
        <li>Click any measure to pause the music and hear it explained with a count-in</li>
      </ul>
      <button type="button" className="btn-primary pa-cta" onClick={onStart}>
        Get started
      </button>
    </div>
  )
}

// ── BPM setup ─────────────────────────────────────────────────────────────────

function BpmSetup({ bpm, setBpm, onStart }: {
  bpm: number
  setBpm: (v: number) => void
  onStart: () => void
}) {
  const tapTimesRef = useRef<number[]>([])
  const [tapCount, setTapCount] = useState(0)

  const handleTapTempo = useCallback(() => {
    const now = performance.now()
    const recent = tapTimesRef.current.filter(t => now - t < 3000)
    recent.push(now)
    tapTimesRef.current = recent
    setTapCount(recent.length)
    if (recent.length >= 2) {
      const avg = (recent[recent.length - 1] - recent[0]) / (recent.length - 1)
      setBpm(Math.max(40, Math.min(200, Math.round(60000 / avg))))
    }
  }, [setBpm])

  const speedLabel =
    bpm < 70 ? 'Very slow' :
    bpm < 90 ? 'Slow' :
    bpm < 110 ? 'Moderate' :
    bpm < 140 ? 'Upbeat' : 'Fast'

  return (
    <div className="pa-stage pa-bpm-setup">
      <h2 className="pa-setup-heading">Set your tempo</h2>
      <p className="pa-setup-hint">Pick a speed that feels comfortable — there's no wrong answer.</p>

      <div className="pa-bpm-display">
        <span className="pa-bpm-number">{bpm}</span>
        <span className="pa-bpm-unit">BPM</span>
      </div>
      <p className="pa-speed-label">{speedLabel}</p>

      <input
        type="range" min="40" max="200" value={bpm}
        onChange={e => { setBpm(Number(e.target.value)); tapTimesRef.current = []; setTapCount(0) }}
        className="pa-bpm-slider"
        aria-label="Tempo in BPM"
      />
      <div className="pa-slider-labels"><span>40</span><span>200</span></div>

      <button type="button" className="pa-tap-tempo-btn" onClick={handleTapTempo}>
        Tap tempo
        {tapCount >= 2 && <span className="pa-tap-hint"> ({tapCount} taps)</span>}
      </button>

      <button type="button" className="btn-primary pa-cta" onClick={onStart}>
        Let's play →
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
  // Each block's props are stable references from the REEL constant
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
