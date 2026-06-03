import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { renderPattern } from '../lib/vexflowPattern'
import { generateReel, type GeneratedMeasure } from '../lib/rhythmGenerator'
import { tickEngine } from '../lib/audio'
import { expectedOnsets } from '../lib/rhythm'
import { RhythmPlayback } from '../components/RhythmPlayback'
import { usePageTitle } from '../hooks/usePageTitle'
import { triggerRainbowBurst } from '../lib/rippleEngine'
import {
  SLOT_PX,
  CURSOR_FRAC,
  msPerMeasure,
  msPerBeat,
  reelTranslateX,
  measureAtCursor,
  totalMeasuresPassed,
  onsetDueMs,
  shouldPulseDownbeat,
  strayTapX,
  resumedStartTime,
} from '../lib/playAlongTiming'
import {
  loadPlayAlongConfig,
  reelLevel,
  type PlayAlongConfig,
} from '../lib/playAlongConfig'

// ── Reel setup ────────────────────────────────────────────────────────────────

const REEL_UNIQUE = 24
const HIT_WINDOW_MS = 175
const REVIEW_SLOT_PX = 320

function buildReel(level: number, seed = Math.floor(Math.random() * 99999)): GeneratedMeasure[] {
  return generateReel(REEL_UNIQUE, seed + level * 100)
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'welcome' | 'static' | 'playing' | 'gameover'

/** A note onset that the game is tracking for hit/miss. */
interface PendingOnset {
  measureAbsIdx: number   // absolute (non-looped) measure index
  measureLoopIdx: number  // 0..REEL_UNIQUE-1
  eventIndex: number      // index within the measure's events array
  beatQuarters: number    // beat position in quarter-note units
  dueMs: number           // elapsed ms when this note is at the cursor
  resolved: boolean       // hit or miss already recorded
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlayAlong() {
  usePageTitle('Play Along')

  // Config loaded from localStorage (admin-editable)
  const [cfg] = useState<PlayAlongConfig>(loadPlayAlongConfig)

  const [phase, setPhase]                   = useState<Phase>('welcome')
  const [bpm, setBpm]                       = useState(cfg.startBpm)
  const [beatIndex, setBeatIndex]           = useState<number | null>(null)
  const [tapFlash, setTapFlash]             = useState(false)
  const [reviewMeasure, setReviewMeasure]   = useState<GeneratedMeasure | null>(null)
  const [paused, setPaused]                 = useState(false)
  const [mistakenMeasures, setMistakenMeasures] = useState<GeneratedMeasure[]>([])

  // Green (hit) and orange (miss) dots, keyed by looped measure index
  const [hitMap,  setHitMap]  = useState<Record<number, number[]>>({})
  const [missMap, setMissMap] = useState<Record<number, number[]>>({})
  // Stray taps (tap with no note under it): px x-positions within the slot, per measure
  const [strayMap, setStrayMap] = useState<Record<number, number[]>>({})

  // Downbeat pulse: which measure is at the cursor and a nonce that bumps each
  // downbeat so the active arrow replays its grow/shrink animation.
  const [pulse, setPulse] = useState<{ idx: number; n: number } | null>(null)

  // BPM notification banner
  const [bpmNotif, setBpmNotif] = useState<number | null>(null)

  // DOM refs
  const tapBtnRef       = useRef<HTMLButtonElement>(null)
  const reelViewportRef = useRef<HTMLDivElement>(null)
  const reelTrackRef    = useRef<HTMLDivElement>(null)

  // RAF / timing refs
  const phaseRef     = useRef<Phase>('welcome')
  const bpmRef       = useRef(cfg.startBpm)
  const startTimeRef = useRef<number>(0)     // performance.now() at play start

  // Pause (review modal open) — freezes reel + hit detection
  const pausedRef     = useRef(false)
  const pauseStartRef = useRef(0)

  // User-initiated pause (pause button)
  const userPausedRef       = useRef(false)
  const userPauseElapsedRef = useRef(0)

  // The reel measure currently under the cursor (updated each RAF frame).
  const cursorLoopIdxRef = useRef(0)

  // Game progression refs
  const consecutiveMissesRef  = useRef(0)
  const successfulMeasuresRef = useRef(0)
  const prevCompletedRef      = useRef(-1)       // last absolute measure we scored
  const bpmNotifTimerRef      = useRef<number | null>(null)

  // Current measure beat dots
  const [beatsInMeasure, setBeatsInMeasure] = useState(4)
  const prevMeasureLoopIdxRef = useRef(-1)

  // Pending onsets ref (tracking upcoming notes)
  const pendingRef = useRef<PendingOnset[]>([])
  const reelRef    = useRef<GeneratedMeasure[]>(buildReel(reelLevel(cfg, 0)))

  // Tap timing
  const tapTimesRef     = useRef<number[]>([])
  const tapFlashTimerRef = useRef<number | null>(null)

  // Loop indices that had at least one miss during this round (for game-over review)
  const mistakenLoopIndicesRef = useRef(new Set<number>())

  // ── Build pending onsets for a given absolute measure index ───────────────

  const scheduleMeasure = useCallback((absIdx: number) => {
    const loopIdx  = absIdx % REEL_UNIQUE
    const measure  = reelRef.current[loopIdx]
    const mspM     = msPerMeasure(bpmRef.current)
    const bpm      = bpmRef.current
    const onsets   = expectedOnsets({ events: measure.events })

    for (const { eventIndex, beat } of onsets) {
      pendingRef.current.push({
        measureAbsIdx:  absIdx,
        measureLoopIdx: loopIdx,
        eventIndex,
        beatQuarters:   beat,
        dueMs:          onsetDueMs(absIdx, beat, mspM, bpm),
        resolved:       false,
      })
    }
  }, [])

  // ── Pre-schedule the first several measures ───────────────────────────────

  function initPending() {
    pendingRef.current = []
    prevCompletedRef.current = -1
    for (let i = 0; i < 4; i++) scheduleMeasure(i)
  }

  // ── RAF-driven reel scroll ────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return

    let rafId: number
    const frame = () => {
      // Frozen while review modal or user pause is active
      if (pausedRef.current || userPausedRef.current) {
        rafId = requestAnimationFrame(frame)
        return
      }
      const elapsed  = performance.now() - startTimeRef.current
      const mspM     = msPerMeasure(bpmRef.current)
      const loopMs   = REEL_UNIQUE * mspM
      const vpWidth  = reelViewportRef.current?.offsetWidth ?? window.innerWidth

      // Scroll
      if (reelTrackRef.current) {
        const tx = reelTranslateX(elapsed, vpWidth, mspM, loopMs)
        reelTrackRef.current.style.transform = `translateX(${tx}px)`
      }

      // Beat dots: update when measure changes
      const loopIdx = measureAtCursor(elapsed, mspM, REEL_UNIQUE)
      cursorLoopIdxRef.current = loopIdx
      if (loopIdx !== prevMeasureLoopIdxRef.current) {
        prevMeasureLoopIdxRef.current = loopIdx
        setBeatsInMeasure(reelRef.current[loopIdx]?.timeSigTop ?? 4)
      }

      // Pre-schedule upcoming measures
      const absIdx = totalMeasuresPassed(elapsed, mspM)
      for (let a = absIdx; a <= absIdx + 3; a++) {
        const alreadyScheduled = pendingRef.current.some(p => p.measureAbsIdx === a)
        if (!alreadyScheduled) scheduleMeasure(a)
      }

      // Miss detection: any onset whose window has passed without being tapped
      const msB = msPerBeat(bpmRef.current)
      for (const onset of pendingRef.current) {
        if (onset.resolved) continue
        if (elapsed > onset.dueMs + HIT_WINDOW_MS) {
          onset.resolved = true
          consecutiveMissesRef.current++
          mistakenLoopIndicesRef.current.add(onset.measureLoopIdx)
          setMissMap(prev => {
            const ex = prev[onset.measureLoopIdx] ?? []
            if (ex.includes(onset.eventIndex)) return prev
            return { ...prev, [onset.measureLoopIdx]: [...ex, onset.eventIndex] }
          })
          if (consecutiveMissesRef.current >= cfg.consecutiveMissesReset) {
            triggerGameOver()
            return
          }
        }
        void msB
      }

      // Completed measure scoring: when cursor moves past a measure's last onset
      const completed = totalMeasuresPassed(elapsed, mspM) - 1
      if (completed > prevCompletedRef.current && completed >= 0) {
        prevCompletedRef.current = completed
        const compLoopIdx = completed % REEL_UNIQUE
        const hadMiss = missMap[compLoopIdx]?.length > 0
        if (!hadMiss) {
          successfulMeasuresRef.current++
          const newLevel = reelLevel(cfg, successfulMeasuresRef.current)
          if (newLevel > reelLevel(cfg, successfulMeasuresRef.current - 1)) {
            reelRef.current = buildReel(newLevel, 1337)
            setHitMap({})
            setMissMap({})
            setStrayMap({})
          }
          if (
            successfulMeasuresRef.current % cfg.bpmIncreaseAfterMeasures === 0 &&
            bpmRef.current < cfg.bpmCap
          ) {
            const newBpm = Math.min(bpmRef.current + cfg.bpmIncreaseAmount, cfg.bpmCap)
            bpmRef.current = newBpm
            setBpm(newBpm)
            setBpmNotif(newBpm)
            if (bpmNotifTimerRef.current) window.clearTimeout(bpmNotifTimerRef.current)
            bpmNotifTimerRef.current = window.setTimeout(() => setBpmNotif(null), 3500)
            tickEngine.cancelAll()
            tickEngine.startMetronome(newBpm, idx => {
              const b = idx % beatsInMeasure
              setBeatIndex(b)
            }, undefined, beatsInMeasure)
          }
        }
      }

      // Trim resolved onsets from the front to avoid unbounded growth
      const cutoff = elapsed - 2000
      while (pendingRef.current.length && pendingRef.current[0].dueMs < cutoff) {
        pendingRef.current.shift()
      }

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cfg])

  // ── Pulse the downbeat arrow at the cursor on every count-one ──────────────
  useEffect(() => {
    if (!shouldPulseDownbeat(phase, beatIndex)) return
    setPulse(prev => ({ idx: cursorLoopIdxRef.current, n: (prev?.n ?? 0) + 1 }))
  }, [beatIndex, phase])

  // ── Welcome → Static ──────────────────────────────────────────────────────

  function startStatic(overrideBpm?: number) {
    tickEngine.cancelAll()
    const initialBpm = overrideBpm ?? cfg.startBpm
    bpmRef.current = initialBpm
    setBpm(initialBpm)
    consecutiveMissesRef.current  = 0
    successfulMeasuresRef.current = 0
    reelRef.current = buildReel(reelLevel(cfg, 0))
    setHitMap({})
    setMissMap({})
    setStrayMap({})
    setBpmNotif(null)
    mistakenLoopIndicesRef.current = new Set()
    setMistakenMeasures([])
    setPaused(false)
    userPausedRef.current = false
    pausedRef.current = false
    const beats = reelRef.current[0]?.timeSigTop ?? 4
    setBeatsInMeasure(beats)
    phaseRef.current = 'static'
    setPhase('static')
    tickEngine.startMetronome(initialBpm, idx => {
      const b = idx % beats
      setBeatIndex(b)
    }, undefined, beats)
  }

  // ── Static → Playing ──────────────────────────────────────────────────────

  function startPlaying() {
    initPending()
    startTimeRef.current = performance.now()

    const firstOnset = pendingRef.current[0]
    if (firstOnset) {
      firstOnset.resolved = true
      consecutiveMissesRef.current = 0
      setHitMap({ [firstOnset.measureLoopIdx]: [firstOnset.eventIndex] })
    }

    phaseRef.current = 'playing'
    setPhase('playing')

    const beats = reelRef.current[0]?.timeSigTop ?? 4
    tickEngine.cancelAll()
    setBeatIndex(0)
    tickEngine.startMetronome(bpmRef.current, idx => {
      const b = idx % beats
      setBeatIndex(b)
    }, undefined, beats)
  }

  // ── Playing → Game Over ───────────────────────────────────────────────────

  function triggerGameOver() {
    tickEngine.cancelAll()
    phaseRef.current = 'gameover'
    setPhase('gameover')
    const indices = Array.from(mistakenLoopIndicesRef.current)
    const measures = indices
      .map(idx => reelRef.current[idx])
      .filter(Boolean) as GeneratedMeasure[]
    setMistakenMeasures(measures)
    setPaused(false)
    userPausedRef.current = false
    pausedRef.current = false
  }

  // ── Stop → Welcome ────────────────────────────────────────────────────────

  function stopToWelcome() {
    tickEngine.cancelAll()
    phaseRef.current = 'welcome'
    setPhase('welcome')
    setBeatIndex(null)
    setPaused(false)
    userPausedRef.current = false
    pausedRef.current = false
  }

  // ── User pause / resume ───────────────────────────────────────────────────

  function handlePause() {
    const elapsed = performance.now() - startTimeRef.current
    userPauseElapsedRef.current = elapsed
    userPausedRef.current = true
    setPaused(true)
    tickEngine.stopMetronome()
  }

  function handleResume() {
    // Recalculate startTime from the saved elapsed at pause — ignores any
    // modal-review pauses that happened while user-paused.
    startTimeRef.current = performance.now() - userPauseElapsedRef.current
    userPausedRef.current = false
    pausedRef.current = false
    setPaused(false)
    const beats = reelRef.current[cursorLoopIdxRef.current]?.timeSigTop ?? 4
    window.setTimeout(() => {
      tickEngine.startMetronome(bpmRef.current, idx => {
        const b = idx % beats
        setBeatIndex(b)
      }, undefined, beats)
    }, 50)
  }

  // ── Tap handler ───────────────────────────────────────────────────────────

  function handleTap() {
    if (phase !== 'playing' || userPausedRef.current) return

    tickEngine.tick('tap')
    setTapFlash(true)
    if (tapFlashTimerRef.current) window.clearTimeout(tapFlashTimerRef.current)
    tapFlashTimerRef.current = window.setTimeout(() => setTapFlash(false), 120)
    if (tapBtnRef.current) {
      const r = tapBtnRef.current.getBoundingClientRect()
      triggerRainbowBurst(r.left + r.width / 2, r.top + r.height / 2)
    }

    const now     = performance.now()
    const elapsed = now - startTimeRef.current
    const mspM    = msPerMeasure(bpmRef.current)

    const recent = tapTimesRef.current.filter(t => now - t < 4000)
    recent.push(now)
    tapTimesRef.current = recent

    let bestOnset: PendingOnset | null = null
    let bestDist = HIT_WINDOW_MS

    for (const onset of pendingRef.current) {
      if (onset.resolved) continue
      const dist = Math.abs(elapsed - onset.dueMs)
      if (dist < bestDist) {
        bestDist  = dist
        bestOnset = onset
      }
    }

    if (bestOnset) {
      bestOnset.resolved = true
      consecutiveMissesRef.current = 0
      setHitMap(prev => {
        const ex = prev[bestOnset!.measureLoopIdx] ?? []
        if (ex.includes(bestOnset!.eventIndex)) return prev
        return { ...prev, [bestOnset!.measureLoopIdx]: [...ex, bestOnset!.eventIndex] }
      })
    } else {
      const loopIdx = measureAtCursor(elapsed, mspM, REEL_UNIQUE)
      const x = strayTapX(elapsed, mspM, SLOT_PX)
      setStrayMap(prev => ({ ...prev, [loopIdx]: [...(prev[loopIdx] ?? []), x] }))
    }
  }

  // ── Measure click → review modal ─────────────────────────────────────────

  function handleMeasureClick(measure: GeneratedMeasure) {
    if (phaseRef.current === 'gameover') {
      setReviewMeasure(measure)
      return
    }
    if (phaseRef.current === 'playing' && !pausedRef.current) {
      pausedRef.current = true
      pauseStartRef.current = performance.now()
    }
    tickEngine.stopMetronome()
    setReviewMeasure(measure)
  }

  function closeReviewModal() {
    setReviewMeasure(null)

    // In game over: no timing to resume
    if (phaseRef.current === 'gameover') return

    if (pausedRef.current && !userPausedRef.current) {
      startTimeRef.current = resumedStartTime(
        startTimeRef.current,
        pauseStartRef.current,
        performance.now(),
      )
      pausedRef.current = false
    } else if (pausedRef.current) {
      pausedRef.current = false  // user is still paused; timing fixed on resume
    }

    if (!userPausedRef.current && (phaseRef.current === 'playing' || phaseRef.current === 'static')) {
      const beats = reelRef.current[0]?.timeSigTop ?? 4
      window.setTimeout(() => {
        tickEngine.startMetronome(bpmRef.current, idx => {
          const b = idx % beats
          setBeatIndex(b)
        }, undefined, beats)
      }, 50)
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => { tickEngine.cancelAll() }, [])

  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) tickEngine.cancelAll() }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'welcome') {
    return <WelcomeScreen onStart={(bpm) => startStatic(bpm)} cfg={cfg} />
  }

  // Review modal shared by playing and game-over phases
  const reviewModal = reviewMeasure && (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) closeReviewModal() }}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">Hear this measure</h2>
          <button type="button" className="modal-close" aria-label="Close"
            onClick={closeReviewModal}>✕</button>
        </div>
        <RhythmPlayback
          pattern={{ events: reviewMeasure.events }}
          timeSigTop={reviewMeasure.timeSigTop}
          timeSigBottom={reviewMeasure.timeSigBottom}
          bpm={bpm}
          onClose={closeReviewModal}
        />
      </div>
    </div>
  )

  if (phase === 'gameover') {
    return (
      <>
        {reviewModal}
        <GameOverScreen
          mistakenMeasures={mistakenMeasures}
          bpm={bpm}
          onReviewMeasure={m => handleMeasureClick(m)}
          onReturnToStart={stopToWelcome}
        />
      </>
    )
  }

  // Compute the initial reel translateX for the static phase
  const vpWidth  = reelViewportRef.current?.offsetWidth ?? window.innerWidth
  const staticTX = vpWidth * CURSOR_FRAC

  return (
    <div className="pa-playing">

      {reviewModal}

      {/* Beat indicator dots */}
      <div className="pa-beat-row" aria-label="Beat indicator">
        {Array.from({ length: beatsInMeasure }, (_, i) => (
          <div
            key={i}
            className={`pa-beat-dot${beatIndex === i ? ' active' : ''}`}
          />
        ))}
      </div>

      {/* Tempo label */}
      <p className="pa-bpm-label">{bpm} BPM</p>

      {/* BPM increase notification */}
      {bpmNotif && (
        <div className="pa-bpm-notif" aria-live="polite">
          ♩ = {bpmNotif} — tempo up!
        </div>
      )}

      {/* Scrolling notation reel */}
      <div className="pa-reel-viewport" ref={reelViewportRef} style={{ position: 'relative' }}>
        <div
          ref={reelTrackRef}
          className="pa-reel-track"
          style={{
            width: `${REEL_UNIQUE * SLOT_PX}px`,
            transform: phase === 'static' ? `translateX(${staticTX}px)` : undefined,
          }}
        >
          {reelRef.current.map((item, i) => (
            <NotationBlock
              key={i}
              measure={item}
              onClick={() => handleMeasureClick(item)}
              hitNoteIndices={hitMap[i]}
              missNoteIndices={missMap[i]}
              strayXs={strayMap[i]}
              pulseNonce={pulse?.idx === i ? pulse.n : 0}
            />
          ))}
        </div>
      </div>

      {/* TAP / START button */}
      <div className="pa-controls-row">
        <button
          ref={tapBtnRef}
          type="button"
          className={`pa-tap-btn${tapFlash ? ' flash' : ''}${paused ? ' pa-tap-btn-muted' : ''}`}
          onPointerDown={e => {
            e.preventDefault()
            if (phase === 'static') startPlaying()
            else handleTap()
          }}
          aria-label={phase === 'static' ? 'Start' : 'Tap'}
        >
          <span className="pa-tap-btn-label">{phase === 'static' ? 'START' : 'TAP'}</span>
          <span className="pa-tap-btn-ring" aria-hidden="true" />
        </button>
      </div>

      {/* Secondary controls */}
      <div className="pa-secondary-controls">
        {phase === 'playing' && !reviewMeasure && (
          paused ? (
            <button type="button" className="pa-pause-btn active" onClick={handleResume}>
              ▶ Resume
            </button>
          ) : (
            <button type="button" className="pa-pause-btn" onClick={handlePause}>
              ⏸ Pause
            </button>
          )
        )}
        <button type="button" className="pa-stop-btn-pill" onClick={stopToWelcome}>
          ■ Stop
        </button>
      </div>

    </div>
  )
}

// ── Welcome screen ─────────────────────────────────────────────────────────────

export function WelcomeScreen({ onStart, cfg }: { onStart: (bpm: number) => void; cfg: PlayAlongConfig }) {
  const BPM_MIN = 40
  const BPM_MAX = cfg.bpmCap

  const [startBpm, setStartBpm] = useState(cfg.startBpm)

  const speedLabel =
    startBpm < 55 ? 'Slow' :
    startBpm < 72 ? 'Moderate' :
    startBpm < 90 ? 'Fast' :
    'Very fast'

  const altSigs = cfg.timeSigs
    .filter(ts => !(ts.top === 4 && ts.bottom === 4))
    .sort((a, b) => a.afterMeasures - b.afterMeasures)
  const altUnlockAt = altSigs[0]?.afterMeasures ?? cfg.bpmIncreaseAfterMeasures

  return (
    <div className="pa-stage pa-welcome">
      <h1 className="pa-welcome-title">Play Along</h1>
      <p className="pa-welcome-body">
        Sheet music appears on screen. Hit <strong>START</strong> and tap along —
        notes you hit turn green, misses turn orange.
        {cfg.consecutiveMissesReset} misses in a row ends the game.
      </p>
      <ul className="pa-welcome-bullets">
        <li>Watch the orange arrow — it marks each downbeat and pulses to keep your place</li>
        <li>Tap each note in time as the music scrolls by</li>
        <li>
          Tempo rises by {cfg.bpmIncreaseAmount} every {cfg.bpmIncreaseAfterMeasures} clean
          measures, up to {cfg.bpmCap} BPM
        </li>
        {altSigs.length > 0 && (
          <li>
            After {altUnlockAt} clean measures,{' '}
            {altSigs.map(ts => `${ts.top}/${ts.bottom}`).join(' and ')} can appear
          </li>
        )}
        <li>Tap any measure to hear it played back</li>
      </ul>

      {/* Starting BPM picker */}
      <p className="pa-setup-heading">Starting tempo</p>
      <div className="pa-bpm-display">
        <span className="pa-bpm-number">{startBpm}</span>
        <span className="pa-bpm-unit">BPM</span>
      </div>
      <p className="pa-speed-label">{speedLabel}</p>
      <input
        type="range"
        className="pa-bpm-slider"
        min={BPM_MIN}
        max={BPM_MAX}
        step={1}
        value={startBpm}
        onChange={e => setStartBpm(Number(e.target.value))}
        aria-label="Starting BPM"
      />
      <div className="pa-slider-labels">
        <span>{BPM_MIN}</span>
        <span>{BPM_MAX}</span>
      </div>

      <button type="button" className="btn-primary pa-cta" onClick={() => onStart(startBpm)}>
        Let's go
      </button>
    </div>
  )
}

// ── Game Over screen ────────────────────────────────────────────────────────────

export interface GameOverScreenProps {
  mistakenMeasures: GeneratedMeasure[]
  bpm: number
  onReviewMeasure: (m: GeneratedMeasure) => void
  onReturnToStart: () => void
}

export function GameOverScreen({ mistakenMeasures, onReviewMeasure, onReturnToStart }: GameOverScreenProps) {
  const [showList, setShowList] = useState(false)

  if (!showList) {
    return (
      <div className="pa-stage pa-gameover">
        <h1 className="pa-gameover-title">Too many misses!</h1>
        <p className="pa-gameover-body">
          {mistakenMeasures.length > 0
            ? 'Review the measures that tripped you up before trying again.'
            : 'No measures to review.'}
        </p>
        {mistakenMeasures.length > 0 && (
          <button type="button" className="btn-primary pa-cta" onClick={() => setShowList(true)}>
            Review mistaken measures
          </button>
        )}
        <button type="button" className="pa-stop-btn-pill" onClick={onReturnToStart}>
          Return to start page
        </button>
      </div>
    )
  }

  return (
    <div className="pa-gameover-review">
      <p className="pa-mistakes-header">Click each measure to see its rhythm</p>
      <div className="pa-mistakes-list">
        {mistakenMeasures.map((measure, i) => (
          <div
            key={i}
            className="pa-mistake-card"
            role="button"
            tabIndex={0}
            onClick={() => onReviewMeasure(measure)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onReviewMeasure(measure) }}
            aria-label={`Hear measure: ${measure.label}`}
          >
            <MistakeMeasureBlock measure={measure} />
          </div>
        ))}
      </div>
      <button type="button" className="btn-primary pa-cta" onClick={onReturnToStart}>
        Return to start page
      </button>
    </div>
  )
}

// ── Mistake measure card (used in GameOverScreen review list) ──────────────────

const MistakeMeasureBlock = memo(function MistakeMeasureBlock({ measure }: { measure: GeneratedMeasure }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try {
      renderPattern(
        el,
        { events: measure.events },
        measure.timeSigTop,
        measure.timeSigBottom,
        { fixedTotalWidth: REVIEW_SLOT_PX, showClef: true, showTimeSignature: true, seamless: false },
      )
    } catch {
      // ignore render errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const levelDots = '●'.repeat(measure.level) + '○'.repeat(5 - measure.level)

  return (
    <div className="pa-mistake-card-inner">
      <div ref={containerRef} className="pa-notation-container" />
      <div className="pa-measure-footer">
        <span className="pa-measure-label">{measure.label}</span>
        <span className="pa-measure-level" aria-label={`Level ${measure.level}`}>{levelDots}</span>
      </div>
      <span className="pa-measure-hint">click to hear</span>
    </div>
  )
})

// ── Notation block (used in the scrolling reel) ────────────────────────────────

interface NotationBlockProps {
  measure: GeneratedMeasure
  onClick: () => void
  hitNoteIndices?: number[]
  missNoteIndices?: number[]
  strayXs?: number[]
  pulseNonce?: number
}

const NotationBlock = memo(function NotationBlock({
  measure,
  onClick,
  hitNoteIndices,
  missNoteIndices,
  strayXs,
  pulseNonce = 0,
}: NotationBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const anchorsRef   = useRef<Map<number, number>>(new Map())
  const [downbeatNoteX, setDownbeatNoteX] = useState<number | null>(null)

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

      if (result.firstEventX !== undefined) setDownbeatNoteX(result.firstEventX)
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
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-label={`Hear measure: ${measure.label}`}
    >
      <div className="pa-notation-wrapper">
        {downbeatNoteX !== null && (
          <div
            key={pulseNonce}
            className={`pa-beat1-arrow${hitNoteIndices?.includes(0) ? ' hit' : ''}${pulseNonce > 0 ? ' pulsing' : ''}`}
            aria-hidden="true"
            style={{ left: downbeatNoteX }}
          >▼</div>
        )}
        <div ref={containerRef} className="pa-notation-container" />

        {hitNoteIndices && hitNoteIndices.length > 0 && (
          <div className="pa-dots-layer" aria-hidden="true">
            {hitNoteIndices.filter(idx => idx !== 0).map(idx => {
              const x = anchorsRef.current.get(idx)
              return x !== undefined
                ? <div key={`h${idx}`} className="pa-hit-dot" style={{ left: x }} />
                : null
            })}
          </div>
        )}

        {missNoteIndices && missNoteIndices.length > 0 && (
          <div className="pa-dots-layer" aria-hidden="true">
            {missNoteIndices.map(idx => {
              const x = anchorsRef.current.get(idx)
              return x !== undefined
                ? <div key={`m${idx}`} className="pa-miss-dot" style={{ left: x }} />
                : null
            })}
          </div>
        )}

        {strayXs && strayXs.length > 0 && (
          <div className="pa-dots-layer" aria-hidden="true">
            {strayXs.map((x, i) => (
              <div key={`s${i}`} className="pa-stray-x" style={{ left: x }}>×</div>
            ))}
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
