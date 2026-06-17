import { useCallback, useEffect, useRef, useState } from 'react'
import {
  generateMeasureAtIndex,
  type DifficultyMode,
  type GeneratedMeasure,
} from '../lib/rhythmGenerator'
import { tickEngine } from '../lib/audio'
import { expectedOnsets } from '../lib/rhythm'
import { RhythmPlayback } from '../components/RhythmPlayback'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  SLOT_PX,
  CURSOR_FRAC,
  resumedStartTime,
} from '../lib/playAlongTiming'
import {
  loadPlayAlongConfig,
  type PlayAlongConfig,
} from '../lib/playAlongConfig'
import { getSession, updatePlayAlongBest } from '../lib/localDb'
import {
  SLOT_COUNT,
  EXTRA_SLOTS,
} from './play-along/constants'
import { NotationBlock } from './play-along/NotationBlock'
import { GameOverScreen, type GameOverScreenProps } from './play-along/GameOverScreen'
import { WelcomeScreen } from './play-along/WelcomeScreen'
import { useGameLoop } from './play-along/useGameLoop'
import { useTapHandler } from './play-along/useTapHandler'

export { GameOverScreen, WelcomeScreen }
export type { GameOverScreenProps }

// ── Types ─────────────────────────────────────────────────────────────────────

export type Phase = 'welcome' | 'static' | 'playing' | 'gameover'

/** A note onset that the game is tracking for hit/miss. */
export interface PendingOnset {
  measureAbsIdx: number   // absolute (non-looped) measure index
  measureLoopIdx: number  // 0..SLOT_COUNT-1
  eventIndex: number      // index within the measure's events array
  beatQuarters: number    // beat position in quarter-note units
  duePx: number           // reelPx when this note is at the cursor
  resolved: boolean       // hit or miss already recorded
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlayAlong() {
  usePageTitle('Play Along', 'Sheet music scrolls past at a steady tempo — tap along and feel the rhythm. Free, no account needed.')

  // Config loaded from localStorage (admin-editable)
  const [cfg, setCfg] = useState<PlayAlongConfig>(loadPlayAlongConfig)

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

  // Difficulty mode and concept-stage notification
  const [mode, setMode] = useState<DifficultyMode>('easy')
  const [stageNotif, setStageNotif] = useState<string | null>(null)

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

  // Difficulty mode ref (for RAF access without stale closure)
  const modeRef            = useRef<DifficultyMode>('easy')
  // Random seed for this game session — new each startStatic call
  const baseSeedRef        = useRef(1337)
  // Which absolute measure index each DOM slot currently holds
  const slotGenerationsRef = useRef<number[]>([])
  // Stage notification timer
  const stageNotifTimerRef = useRef<number | null>(null)
  // Previous concept stage index — for detecting stage advances
  const prevStageRef       = useRef(-1)

  // Current measure beat dots
  const [beatsInMeasure, setBeatsInMeasure] = useState(4)
  const prevMeasureLoopIdxRef = useRef(-1)
  const prevBeatIndexRef = useRef(-1)

  // Pending onsets ref (tracking upcoming notes)
  const pendingRef = useRef<PendingOnset[]>([])
  // Ring buffer of SLOT_COUNT measure slots — populated and recycled as the game advances
  const reelRef    = useRef<GeneratedMeasure[]>([])

  // Tap timing
  const tapTimesRef     = useRef<number[]>([])
  const tapFlashTimerRef = useRef<number | null>(null)

  // Absolute-index → GeneratedMeasure for every measure that had at least one miss
  // (keyed by absIdx so recycled slots don't overwrite prior mistakes)
  const mistakenAbsMeasuresRef = useRef(new Map<number, GeneratedMeasure>())

  // Reel scroll: accumulated pixel offset (avoids position jump when BPM changes)
  const reelPxRef       = useRef(0)
  const lastFrameTimeRef = useRef(0)

  // ── Build pending onsets for a given absolute measure index ───────────────

  const scheduleMeasure = useCallback((absIdx: number) => {
    const loopIdx = absIdx % SLOT_COUNT
    const measure = reelRef.current[loopIdx]
    const onsets  = expectedOnsets({ events: measure.events })

    for (const { eventIndex, beat } of onsets) {
      pendingRef.current.push({
        measureAbsIdx:  absIdx,
        measureLoopIdx: loopIdx,
        eventIndex,
        beatQuarters:   beat,
        duePx:          (absIdx + beat / 4) * SLOT_PX,
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

  // ── Game loop (RAF scroll + beat tracking + downbeat pulse) ─────────────────
  useGameLoop({
    phase,
    cfg,
    beatsInMeasure,
    bpmRef,
    reelRef,
    reelViewportRef,
    reelTrackRef,
    pendingRef,
    slotGenerationsRef,
    modeRef,
    pausedRef,
    userPausedRef,
    reelPxRef,
    lastFrameTimeRef,
    cursorLoopIdxRef,
    consecutiveMissesRef,
    prevMeasureLoopIdxRef,
    prevBeatIndexRef,
    prevStageRef,
    prevCompletedRef,
    stageNotifTimerRef,
    bpmNotifTimerRef,
    successfulMeasuresRef,
    mistakenAbsMeasuresRef,
    baseSeedRef,
    setBeatsInMeasure,
    setBeatIndex,
    setHitMap,
    setMissMap,
    setStrayMap,
    setPulse,
    setStageNotif,
    setBpmNotif,
    setBpm,
    onGameOver: triggerGameOver,
    scheduleMeasure,
    beatIndex,
    missMap,
  })

  // ── Welcome → Static ──────────────────────────────────────────────────────

  function startStatic(overrideBpm?: number, newMode?: DifficultyMode) {
    tickEngine.cancelAll()
    const initialBpm   = overrideBpm ?? cfg.startBpm
    const activeMode   = newMode ?? mode
    bpmRef.current     = initialBpm
    modeRef.current    = activeMode
    if (newMode) setMode(newMode)
    setBpm(initialBpm)
    consecutiveMissesRef.current  = 0
    successfulMeasuresRef.current = 0
    prevCompletedRef.current      = -1
    prevStageRef.current          = 0  // don't fire notification at game start

    // Fresh random seed — every game session gets a unique measure sequence
    const seed = Math.floor(Math.random() * 9999999)
    baseSeedRef.current = seed

    // Populate the ring buffer with the first SLOT_COUNT measures
    reelRef.current        = Array.from({ length: SLOT_COUNT }, (_, i) => generateMeasureAtIndex(i, activeMode, seed))
    slotGenerationsRef.current = Array.from({ length: SLOT_COUNT }, (_, i) => i)

    setHitMap({})
    setMissMap({})
    setStrayMap({})
    setBpmNotif(null)
    setStageNotif(null)
    mistakenAbsMeasuresRef.current = new Map()
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
    reelPxRef.current = 0
    lastFrameTimeRef.current = 0

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
    tickEngine.startMetronome(bpmRef.current, undefined, undefined, beats)
  }

  // ── Playing → Game Over ───────────────────────────────────────────────────

  function triggerGameOver() {
    tickEngine.cancelAll()
    const session = getSession()
    if (session) updatePlayAlongBest(session.userId, successfulMeasuresRef.current)
    phaseRef.current = 'gameover'
    setPhase('gameover')
    // Use the stored measure objects — correct even if a slot was recycled since the miss
    setMistakenMeasures([...mistakenAbsMeasuresRef.current.values()])
    setPaused(false)
    userPausedRef.current = false
    pausedRef.current = false
  }

  // ── Stop → Welcome ────────────────────────────────────────────────────────

  function stopToWelcome() {
    tickEngine.cancelAll()
    const session = getSession()
    if (session && phaseRef.current === 'playing') {
      updatePlayAlongBest(session.userId, successfulMeasuresRef.current)
    }
    mistakenAbsMeasuresRef.current = new Map()
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
      tickEngine.startMetronome(bpmRef.current, undefined, undefined, beats)
    }, 50)
  }

  // ── Tap handler ───────────────────────────────────────────────────────────

  const handleTap = useTapHandler({
    phase,
    userPausedRef,
    tapFlashTimerRef,
    tapBtnRef,
    tapTimesRef,
    reelPxRef,
    bpmRef,
    pendingRef,
    consecutiveMissesRef,
    setTapFlash,
    setHitMap,
    setStrayMap,
  })

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
        tickEngine.startMetronome(bpmRef.current, undefined, undefined, beats)
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
    return <WelcomeScreen onStart={(bpm, m) => startStatic(bpm, m)} cfg={cfg} onCfgChange={setCfg} />
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

      {/* Concept-stage advance notification */}
      {stageNotif && (
        <div className="pa-stage-notif" aria-live="polite">
          New concept: {stageNotif}
        </div>
      )}

      {/* Scrolling notation reel */}
      <div className="pa-reel-viewport" ref={reelViewportRef} style={{ position: 'relative' }}>
        <div
          ref={reelTrackRef}
          className="pa-reel-track"
          style={{
            width: `${(SLOT_COUNT + EXTRA_SLOTS) * SLOT_PX}px`,
            transform: phase === 'static' ? `translateX(${staticTX}px)` : undefined,
          }}
        >
          {Array.from({ length: SLOT_COUNT + EXTRA_SLOTS }, (_, i) => {
            const slotIdx = i % SLOT_COUNT
            const item = reelRef.current[slotIdx]
            return (
              <NotationBlock
                key={i}
                measure={item}
                onClick={() => handleMeasureClick(item)}
                hitNoteIndices={hitMap[slotIdx]}
                missNoteIndices={missMap[slotIdx]}
                strayXs={strayMap[slotIdx]}
                pulseNonce={pulse?.idx === slotIdx ? pulse.n : 0}
              />
            )
          })}
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

