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
  shouldShowDownbeat,
} from '../lib/playAlongTiming'
import {
  loadPlayAlongConfig,
  reelLevel,
  type PlayAlongConfig,
} from '../lib/playAlongConfig'

// ── Reel setup ────────────────────────────────────────────────────────────────

const REEL_UNIQUE = 24
const HIT_WINDOW_MS = 175

function buildReel(level: number, seed = 1337): GeneratedMeasure[] {
  return generateReel(REEL_UNIQUE, seed + level * 100)
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'welcome' | 'static' | 'playing'

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

  const [phase, setPhase]           = useState<Phase>('welcome')
  const [bpm, setBpm]               = useState(cfg.startBpm)
  const [beatIndex, setBeatIndex]   = useState<number | null>(null)
  const [tapFlash, setTapFlash]     = useState(false)
  const [showDownbeat, setShowDownbeat] = useState(false)
  const [reviewMeasure, setReviewMeasure] = useState<GeneratedMeasure | null>(null)

  // Green (hit) and orange (miss) dots, keyed by looped measure index
  const [hitMap,  setHitMap]  = useState<Record<number, number[]>>({})
  const [missMap, setMissMap] = useState<Record<number, number[]>>({})

  // BPM notification banner
  const [bpmNotif, setBpmNotif]     = useState<number | null>(null)

  // Arrow x-position in pixels (set from VexFlow anchor of first note)
  const [arrowX, setArrowX]         = useState<number | null>(null)

  // DOM refs
  const tapBtnRef       = useRef<HTMLButtonElement>(null)
  const reelViewportRef = useRef<HTMLDivElement>(null)
  const reelTrackRef    = useRef<HTMLDivElement>(null)

  // RAF / timing refs
  const phaseRef        = useRef<Phase>('welcome')
  const bpmRef          = useRef(cfg.startBpm)
  const startTimeRef    = useRef<number>(0)     // performance.now() at play start

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
  const tapTimesRef = useRef<number[]>([])
  const tapFlashTimerRef = useRef<number | null>(null)

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
      if (loopIdx !== prevMeasureLoopIdxRef.current) {
        prevMeasureLoopIdxRef.current = loopIdx
        setBeatsInMeasure(reelRef.current[loopIdx]?.timeSigTop ?? 4)
      }

      // Pre-schedule upcoming measures
      const absIdx = totalMeasuresPassed(elapsed, mspM)
      // Schedule up to 4 measures ahead
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
          setMissMap(prev => {
            const ex = prev[onset.measureLoopIdx] ?? []
            if (ex.includes(onset.eventIndex)) return prev
            return { ...prev, [onset.measureLoopIdx]: [...ex, onset.eventIndex] }
          })
          // Check reset
          if (consecutiveMissesRef.current >= cfg.consecutiveMissesReset) {
            resetToStatic()
            return
          }
        }
        void msB // suppress lint — msPerBeat used in tap handler
      }

      // Completed measure scoring: when cursor moves past a measure's last onset
      const completed = totalMeasuresPassed(elapsed, mspM) - 1
      if (completed > prevCompletedRef.current && completed >= 0) {
        prevCompletedRef.current = completed
        const compLoopIdx = completed % REEL_UNIQUE
        const hadMiss = missMap[compLoopIdx]?.length > 0
        if (!hadMiss) {
          successfulMeasuresRef.current++
          // BPM increase
          const newLevel = reelLevel(cfg, successfulMeasuresRef.current)
          if (newLevel > reelLevel(cfg, successfulMeasuresRef.current - 1)) {
            // Rebuild reel with new time sigs at next loop boundary
            reelRef.current = buildReel(newLevel, 1337)
            // Clear dot maps (new measures, fresh start)
            setHitMap({})
            setMissMap({})
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
              setShowDownbeat(shouldShowDownbeat('playing', b))
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

  // ── Start → Static ────────────────────────────────────────────────────────

  function startStatic() {
    tickEngine.cancelAll()
    bpmRef.current = cfg.startBpm
    setBpm(cfg.startBpm)
    consecutiveMissesRef.current  = 0
    successfulMeasuresRef.current = 0
    reelRef.current = buildReel(reelLevel(cfg, 0))
    setHitMap({})
    setMissMap({})
    setBpmNotif(null)
    setShowDownbeat(true)
    const beats = reelRef.current[0]?.timeSigTop ?? 4
    setBeatsInMeasure(beats)
    phaseRef.current = 'static'
    setPhase('static')
    // Metronome runs during the static phase so the player feels the tempo
    // before pressing START.
    tickEngine.startMetronome(cfg.startBpm, idx => {
      const b = idx % beats
      setBeatIndex(b)
      setShowDownbeat(shouldShowDownbeat('static', b))
    }, undefined, beats)
  }

  // ── Static → Playing ──────────────────────────────────────────────────────

  function startPlaying() {
    initPending()
    startTimeRef.current = performance.now()

    // The START click counts as tapping beat 1 of measure 0.
    // Immediately resolve the first onset as a hit and green it.
    const firstOnset = pendingRef.current[0]
    if (firstOnset) {
      firstOnset.resolved = true
      consecutiveMissesRef.current = 0
      setHitMap({ [firstOnset.measureLoopIdx]: [firstOnset.eventIndex] })
    }

    phaseRef.current = 'playing'
    setPhase('playing')

    // Restart the metronome from beat 0 so the first lit dot aligns with
    // the START click — the player hears a clean downbeat as the reel begins.
    const beats = reelRef.current[0]?.timeSigTop ?? 4
    tickEngine.cancelAll()
    setBeatIndex(0)
    setShowDownbeat(true)
    tickEngine.startMetronome(bpmRef.current, idx => {
      const b = idx % beats
      setBeatIndex(b)
      setShowDownbeat(shouldShowDownbeat('playing', b))
    }, undefined, beats)
  }

  // ── Reset to Static ───────────────────────────────────────────────────────

  function resetToStatic() {
    tickEngine.cancelAll()
    phaseRef.current = 'static'
    setPhase('static')
    consecutiveMissesRef.current = 0
    setHitMap({})
    setMissMap({})
    setShowDownbeat(true)
    const beats = reelRef.current[0]?.timeSigTop ?? 4
    // Restart metronome from beat 0 so the player gets a fresh count-in.
    setBeatIndex(0)
    tickEngine.startMetronome(bpmRef.current, idx => {
      const b = idx % beats
      setBeatIndex(b)
      setShowDownbeat(shouldShowDownbeat('static', b))
    }, undefined, beats)
  }

  // ── Stop → Welcome ────────────────────────────────────────────────────────

  function stopToWelcome() {
    tickEngine.cancelAll()
    phaseRef.current = 'welcome'
    setPhase('welcome')
    setBeatIndex(null)
    setShowDownbeat(false)
  }

  // ── Arrow x from VexFlow anchor of first note ─────────────────────────────

  const handleFirstAnchor = useCallback((anchorX: number) => {
    setArrowX(anchorX)
  }, [])

  // ── Tap handler ───────────────────────────────────────────────────────────

  function handleTap() {
    if (phase !== 'playing') return

    // Visual feedback
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
    const bpm     = bpmRef.current

    // Track tap times for BPM drift detection
    const recent = tapTimesRef.current.filter(t => now - t < 4000)
    recent.push(now)
    tapTimesRef.current = recent

    // Find the closest unresolved onset within the hit window
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
    }
    // If no matching onset: tap happened between notes — treat as no-op (not a miss)

    void mspM; void bpm  // suppress unused-var lint
  }

  // ── Measure click → review modal ─────────────────────────────────────────

  function handleMeasureClick(measure: GeneratedMeasure) {
    setReviewMeasure(measure)
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => { tickEngine.cancelAll() }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'welcome') return <WelcomeScreen onStart={startStatic} cfg={cfg} />

  // Compute the initial reel translateX for the static phase
  const vpWidth       = reelViewportRef.current?.offsetWidth ?? window.innerWidth
  const staticTX      = vpWidth * CURSOR_FRAC   // set in CSS instead; this is a fallback

  // Arrow screen-x: cursor position + first-note offset within the measure
  const arrowScreenX  = vpWidth * CURSOR_FRAC + (arrowX ?? 80)

  return (
    <div className="pa-playing">

      {/* Review modal */}
      {reviewMeasure && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setReviewMeasure(null) }}
        >
          <div className="modal-panel">
            <div className="modal-header">
              <h2 className="modal-title">Hear this measure</h2>
              <button type="button" className="modal-close" aria-label="Close"
                onClick={() => setReviewMeasure(null)}>✕</button>
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

      {/* Beat indicator dots — count matches current time signature numerator */}
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

        {/* Downbeat arrow — static: above first note; playing: flashes on beat 1 */}
        {showDownbeat && (
          <div
            className="pa-downbeat-arrow"
            aria-hidden="true"
            style={{ left: arrowScreenX }}
          >
            ▼
          </div>
        )}

        {/* Cursor / read-line — aligned with the downbeat arrow */}
        <div className="pa-cursor-line" aria-hidden="true" style={{ left: arrowScreenX }} />

        <div
          ref={reelTrackRef}
          className="pa-reel-track"
          style={{
            width: `${REEL_UNIQUE * SLOT_PX}px`,
            // Static phase: position first measure at 25% from left
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
              onFirstAnchor={i === 0 ? handleFirstAnchor : undefined}
            />
          ))}
        </div>
      </div>

      {/* TAP / START button */}
      <div className="pa-controls-row">
        <button
          ref={tapBtnRef}
          type="button"
          className={`pa-tap-btn${tapFlash ? ' flash' : ''}`}
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
        <button type="button" className="pa-stop-btn-pill" onClick={stopToWelcome}>
          ■ Stop
        </button>
      </div>

    </div>
  )
}

// ── Welcome screen ─────────────────────────────────────────────────────────────

function WelcomeScreen({ onStart, cfg }: { onStart: () => void; cfg: PlayAlongConfig }) {
  // Find the earliest-unlocking non-4/4 time sig for the instructions
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
        {cfg.consecutiveMissesReset} misses in a row resets the game.
      </p>
      <ul className="pa-welcome-bullets">
        <li>Watch the orange arrow — it marks each downbeat</li>
        <li>Tap when a note passes under the cursor line</li>
        <li>
          Tempo starts at <strong>{cfg.startBpm} BPM</strong> and rises
          by {cfg.bpmIncreaseAmount} every {cfg.bpmIncreaseAfterMeasures} clean
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
      <button type="button" className="btn-primary pa-cta" onClick={onStart}>
        Let's go
      </button>
    </div>
  )
}

// ── Notation block ─────────────────────────────────────────────────────────────

interface NotationBlockProps {
  measure: GeneratedMeasure
  onClick: () => void
  hitNoteIndices?: number[]
  missNoteIndices?: number[]
  onFirstAnchor?: (x: number) => void
}

const NotationBlock = memo(function NotationBlock({
  measure,
  onClick,
  hitNoteIndices,
  missNoteIndices,
  onFirstAnchor,
}: NotationBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const anchorsRef   = useRef<Map<number, number>>(new Map())

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

      // Report the first note's x to the parent (for arrow positioning)
      if (onFirstAnchor && result.anchors.length > 0) {
        onFirstAnchor(result.anchors[0].x)
      }
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
        <div ref={containerRef} className="pa-notation-container" />

        {/* Green hit dots */}
        {hitNoteIndices && hitNoteIndices.length > 0 && (
          <div className="pa-dots-layer" aria-hidden="true">
            {hitNoteIndices.map(idx => {
              const x = anchorsRef.current.get(idx)
              return x !== undefined
                ? <div key={`h${idx}`} className="pa-hit-dot" style={{ left: x }} />
                : null
            })}
          </div>
        )}

        {/* Orange miss dots */}
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
      </div>

      <span className="pa-measure-hint">click to pause &amp; analyze</span>
      <div className="pa-measure-footer">
        <span className="pa-measure-label">{measure.label}</span>
        <span className="pa-measure-level" aria-label={`Level ${measure.level}`}>{levelDots}</span>
      </div>
    </div>
  )
})
