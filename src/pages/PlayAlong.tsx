import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { renderPattern } from '../lib/vexflowPattern'
import {
  generateMeasureAtIndex,
  getConceptStageIndex,
  getConceptStageName,
  type DifficultyMode,
  type GeneratedMeasure,
} from '../lib/rhythmGenerator'
import { tickEngine } from '../lib/audio'
import { expectedOnsets } from '../lib/rhythm'
import { RhythmPlayback } from '../components/RhythmPlayback'
import { usePageTitle } from '../hooks/usePageTitle'
import { triggerRainbowBurst } from '../lib/rippleEngine'
import {
  SLOT_PX,
  CURSOR_FRAC,
  msPerMeasure,
  shouldPulseDownbeat,
  resumedStartTime,
} from '../lib/playAlongTiming'
import {
  DEFAULT_CONFIG,
  loadPlayAlongConfig,
  savePlayAlongConfig,
  type PlayAlongConfig,
} from '../lib/playAlongConfig'
import { getSession, updatePlayAlongBest } from '../lib/localDb'
import {
  SLOT_COUNT,
  LOOK_AHEAD,
  EXTRA_SLOTS,
  HIT_WINDOW_MS,
  REVIEW_SLOT_PX,
} from './play-along/constants'
import { NotationBlock } from './play-along/NotationBlock'

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'welcome' | 'static' | 'playing' | 'gameover'

/** A note onset that the game is tracking for hit/miss. */
interface PendingOnset {
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

  // ── RAF-driven reel scroll ────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return

    let rafId: number
    const frame = () => {
      const now = performance.now()
      // Frozen while review modal or user pause is active
      if (pausedRef.current || userPausedRef.current) {
        lastFrameTimeRef.current = 0  // reset so dt doesn't span the pause on resume
        rafId = requestAnimationFrame(frame)
        return
      }
      const mspM    = msPerMeasure(bpmRef.current)
      const vpWidth = reelViewportRef.current?.offsetWidth ?? window.innerWidth

      // Accumulate reel scroll pixels frame-by-frame so a BPM change only affects
      // future speed and never causes a position jump.
      if (lastFrameTimeRef.current > 0) {
        reelPxRef.current += (now - lastFrameTimeRef.current) * (SLOT_PX / mspM)
      }
      lastFrameTimeRef.current = now

      // Scroll — the ring buffer loops every SLOT_COUNT slots
      if (reelTrackRef.current) {
        const totalLoopPx = SLOT_COUNT * SLOT_PX
        const tx = vpWidth * CURSOR_FRAC - (reelPxRef.current % totalLoopPx)
        reelTrackRef.current.style.transform = `translateX(${tx}px)`
      }

      // Derive position from pixels — always in sync with visual scroll regardless of BPM history
      const measuresScrolled = reelPxRef.current / SLOT_PX
      const absIdx  = Math.floor(measuresScrolled)
      const loopIdx = absIdx % SLOT_COUNT

      cursorLoopIdxRef.current = loopIdx
      if (loopIdx !== prevMeasureLoopIdxRef.current) {
        prevMeasureLoopIdxRef.current = loopIdx
        setBeatsInMeasure(reelRef.current[loopIdx]?.timeSigTop ?? 4)
      }

      const curBeats    = reelRef.current[loopIdx]?.timeSigTop ?? 4
      const measurePhase = measuresScrolled - absIdx          // 0..1 within current measure
      const newBeatIdx   = Math.floor(measurePhase * curBeats) % curBeats
      if (newBeatIdx !== prevBeatIndexRef.current) {
        prevBeatIndexRef.current = newBeatIdx
        setBeatIndex(newBeatIdx)
      }

      // ── Concept-stage advance notification ───────────────────────────────────
      const curStageIdx = getConceptStageIndex(absIdx, modeRef.current)
      if (curStageIdx !== prevStageRef.current && prevStageRef.current >= 0) {
        prevStageRef.current = curStageIdx
        const stageName = getConceptStageName(absIdx, modeRef.current)
        setStageNotif(stageName)
        if (stageNotifTimerRef.current) window.clearTimeout(stageNotifTimerRef.current)
        stageNotifTimerRef.current = window.setTimeout(() => setStageNotif(null), 4000)
      }

      // ── Infinite scroll: recycle stale slots before they re-enter the viewport ──
      // Look LOOK_AHEAD slots ahead; update any slot whose generation doesn't match.
      const staleSlots: number[] = []
      for (let a = absIdx; a < absIdx + LOOK_AHEAD; a++) {
        const slotIdx = a % SLOT_COUNT
        if (slotGenerationsRef.current[slotIdx] !== a) {
          slotGenerationsRef.current[slotIdx] = a
          reelRef.current[slotIdx] = generateMeasureAtIndex(a, modeRef.current, baseSeedRef.current)
          staleSlots.push(slotIdx)
        }
      }
      if (staleSlots.length > 0) {
        // Trigger a re-render so NotationBlock picks up the new measure objects.
        // Clearing the feedback maps for recycled slots is both correct (fresh slate)
        // and serves as the re-render trigger.
        setHitMap(prev  => { const n = {...prev};  for (const s of staleSlots) delete n[s]; return n })
        setMissMap(prev => { const n = {...prev};  for (const s of staleSlots) delete n[s]; return n })
        setStrayMap(prev => { const n = {...prev}; for (const s of staleSlots) delete n[s]; return n })
      }

      // ── Pre-schedule upcoming measures ───────────────────────────────────────
      for (let a = absIdx; a <= absIdx + 3; a++) {
        const alreadyScheduled = pendingRef.current.some(p => p.measureAbsIdx === a)
        if (!alreadyScheduled) scheduleMeasure(a)
      }

      // ── Miss detection ───────────────────────────────────────────────────────
      const hitWindowPx = HIT_WINDOW_MS * (SLOT_PX / mspM)
      for (const onset of pendingRef.current) {
        if (onset.resolved) continue
        if (reelPxRef.current > onset.duePx + hitWindowPx) {
          onset.resolved = true
          consecutiveMissesRef.current++
          // Store the actual measure object so game-over review works even after slot recycle
          mistakenAbsMeasuresRef.current.set(onset.measureAbsIdx, reelRef.current[onset.measureLoopIdx])
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
      }

      // ── Completed measure scoring ─────────────────────────────────────────────
      const completed = absIdx - 1
      if (completed > prevCompletedRef.current && completed >= 0) {
        prevCompletedRef.current = completed
        const compLoopIdx = completed % SLOT_COUNT
        const hadMiss = missMap[compLoopIdx]?.length > 0
        if (!hadMiss) {
          successfulMeasuresRef.current++
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
            tickEngine.startMetronome(newBpm, undefined, undefined, beatsInMeasure)
          }
        }
      }

      // Trim resolved onsets from the front to avoid unbounded growth
      const cutoffPx = reelPxRef.current - 2 * SLOT_PX
      while (pendingRef.current.length && pendingRef.current[0].duePx < cutoffPx) {
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

    const now = performance.now()

    const recent = tapTimesRef.current.filter(t => now - t < 4000)
    recent.push(now)
    tapTimesRef.current = recent

    const tapPx      = reelPxRef.current
    const hitWindowPx = HIT_WINDOW_MS * (SLOT_PX / msPerMeasure(bpmRef.current))

    let bestOnset: PendingOnset | null = null
    let bestDist = hitWindowPx

    for (const onset of pendingRef.current) {
      if (onset.resolved) continue
      const dist = Math.abs(tapPx - onset.duePx)
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
      const loopIdx = Math.floor(reelPxRef.current / SLOT_PX) % SLOT_COUNT
      const x = reelPxRef.current % SLOT_PX
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

// ── Welcome screen ─────────────────────────────────────────────────────────────

export function WelcomeScreen({
  onStart,
  cfg,
  onCfgChange,
}: {
  onStart: (bpm: number, mode: DifficultyMode) => void
  cfg: PlayAlongConfig
  onCfgChange: (cfg: PlayAlongConfig) => void
}) {
  const [localCfg, setLocalCfg] = useState<PlayAlongConfig>(() => ({ ...cfg }))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<DifficultyMode>('easy')

  const BPM_MIN = 40
  const BPM_MAX = localCfg.bpmCap

  const speedLabel =
    localCfg.startBpm < 66  ? 'Slow' :
    localCfg.startBpm < 108 ? 'Moderate' :
    localCfg.startBpm < 168 ? 'Fast' :
    'Very fast'

  function update(patch: Partial<PlayAlongConfig>) {
    setLocalCfg(prev => {
      const next = { ...prev, ...patch }
      savePlayAlongConfig(next)
      onCfgChange(next)
      return next
    })
  }

  function resetDefaults() {
    const fresh = { ...DEFAULT_CONFIG }
    setLocalCfg(fresh)
    savePlayAlongConfig(fresh)
    onCfgChange(fresh)
  }

  const MODE_DESCRIPTIONS: Record<DifficultyMode, string> = {
    easy:         'One new concept every 8 measures — perfect for beginners',
    intermediate: 'One new concept every 4 measures — steady progression',
    advanced:     'One new concept every 2 measures — fast progression',
  }

  return (
    <div className="pa-stage pa-welcome">
      <h1 className="pa-welcome-title">Rhythm Game!</h1>
      <ul className="pa-welcome-bullets">
        <li>Sheet music scrolls by — tap the button in time with each note</li>
        <li>Hits turn green, misses turn orange — {localCfg.consecutiveMissesReset} consecutive misses ends the game</li>
        <li>The orange ▼ marks each downbeat and pulses to keep your place</li>
        <li>
          Every {localCfg.bpmIncreaseAfterMeasures} perfect measures, tempo rises by {localCfg.bpmIncreaseAmount} BPM, up to {localCfg.bpmCap}
        </li>
        <li><strong>Tap any measure while playing to pause and hear it played correctly</strong></li>
      </ul>

      {/* Difficulty mode picker */}
      <div className="pa-mode-section">
        <p className="pa-mode-heading">Difficulty</p>
        <div className="pa-mode-picker">
          {(['easy', 'intermediate', 'advanced'] as DifficultyMode[]).map(m => (
            <button
              key={m}
              type="button"
              className={`pa-mode-btn${selectedMode === m ? ' active' : ''}`}
              onClick={() => setSelectedMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <p className="pa-mode-desc">{MODE_DESCRIPTIONS[selectedMode]}</p>
      </div>

      <p className="pa-tempo-row">
        Starting tempo:{' '}
        <span className="pa-tempo-inline-bpm">{localCfg.startBpm}</span>
        {' '}BPM
        <span className="pa-tempo-inline-label"> · <em>{speedLabel}</em></span>
      </p>
      <input
        type="range"
        className="pa-bpm-slider"
        min={BPM_MIN}
        max={BPM_MAX}
        step={1}
        value={localCfg.startBpm}
        onChange={e => update({ startBpm: Number(e.target.value) })}
        aria-label="Starting BPM"
      />
      <div className="pa-slider-labels">
        <span>{BPM_MIN}</span>
        <span>{BPM_MAX}</span>
      </div>

      <button type="button" className="btn-primary pa-cta" onClick={() => onStart(localCfg.startBpm, selectedMode)}>
        Let's go
      </button>

      {/* Settings accordion */}
      <button
        type="button"
        className="pa-settings-toggle"
        onClick={() => setSettingsOpen(o => !o)}
        aria-expanded={settingsOpen}
      >
        <span className={`pa-settings-caret${settingsOpen ? ' open' : ''}`}>›</span>
        {' '}Settings
      </button>

      {settingsOpen && (
        <div className="pa-settings-panel">

          <section className="pa-settings-section">
            <h3 className="pa-settings-heading">Tempo</h3>
            <label className="pa-settings-row">
              <span>BPM ceiling</span>
              <input type="number" min={localCfg.startBpm} max={400} step={1}
                value={localCfg.bpmCap}
                onChange={e => update({ bpmCap: Number(e.target.value) })}
              />
            </label>
            <label className="pa-settings-row">
              <span>Quantity of perfect measures between tempo increases</span>
              <input type="number" min={1} max={500} step={1}
                value={localCfg.bpmIncreaseAfterMeasures}
                onChange={e => update({ bpmIncreaseAfterMeasures: Number(e.target.value) })}
              />
            </label>
            <label className="pa-settings-row">
              <span>BPM increase per step</span>
              <input type="number" min={1} max={20} step={1}
                value={localCfg.bpmIncreaseAmount}
                onChange={e => update({ bpmIncreaseAmount: Number(e.target.value) })}
              />
            </label>
          </section>

          <section className="pa-settings-section">
            <h3 className="pa-settings-heading">Difficulty</h3>
            <label className="pa-settings-row">
              <span>Consecutive misses before reset</span>
              <input type="number" min={1} max={50} step={1}
                value={localCfg.consecutiveMissesReset}
                onChange={e => update({ consecutiveMissesReset: Number(e.target.value) })}
              />
            </label>
          </section>

          <div className="pa-settings-footer">
            <button type="button" className="pa-settings-reset" onClick={resetDefaults}>
              Reset to defaults
            </button>
          </div>

        </div>
      )}
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
      <button type="button" className="btn-primary pa-cta" onClick={onReturnToStart}>
        Return to start page
      </button>
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

