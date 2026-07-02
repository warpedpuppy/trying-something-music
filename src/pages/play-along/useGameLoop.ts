import { useEffect } from 'react'
import {
  generateMeasureAtIndex,
  getConceptStageIndex,
  getConceptStageName,
  type DifficultyMode,
  type GeneratedMeasure,
} from '../../lib/rhythmGenerator'
import { tickEngine } from '../../lib/audio'
import type { PlayAlongConfig } from '../../lib/playAlongConfig'
import { msPerMeasure, shouldPulseDownbeat, SLOT_PX, CURSOR_FRAC } from '../../lib/playAlongTiming'
import { SLOT_COUNT, LOOK_AHEAD, HIT_WINDOW_MS } from './constants'
import type { Phase, PendingOnset } from '../PlayAlong'

interface UseGameLoopArgs {
  phase: Phase
  cfg: PlayAlongConfig
  currentBeatsInMeasureRef: React.MutableRefObject<number>
  bpmRef: React.MutableRefObject<number>
  reelRef: React.MutableRefObject<GeneratedMeasure[]>
  setReelSnapshot: React.Dispatch<React.SetStateAction<GeneratedMeasure[]>>
  reelViewportRef: React.MutableRefObject<HTMLDivElement | null>
  reelTrackRef: React.MutableRefObject<HTMLDivElement | null>
  pendingRef: React.MutableRefObject<PendingOnset[]>
  slotGenerationsRef: React.MutableRefObject<number[]>
  modeRef: React.MutableRefObject<DifficultyMode>
  pausedRef: React.MutableRefObject<boolean>
  userPausedRef: React.MutableRefObject<boolean>
  reelPxRef: React.MutableRefObject<number>
  lastFrameTimeRef: React.MutableRefObject<number>
  cursorLoopIdxRef: React.MutableRefObject<number>
  consecutiveMissesRef: React.MutableRefObject<number>
  prevMeasureLoopIdxRef: React.MutableRefObject<number>
  prevBeatIndexRef: React.MutableRefObject<number>
  prevStageRef: React.MutableRefObject<number>
  prevCompletedRef: React.MutableRefObject<number>
  stageNotifTimerRef: React.MutableRefObject<number | null>
  bpmNotifTimerRef: React.MutableRefObject<number | null>
  successfulMeasuresRef: React.MutableRefObject<number>
  missedMeasureLoopIdxsRef: React.MutableRefObject<Set<number>>
  mistakenAbsMeasuresRef: React.MutableRefObject<Map<number, GeneratedMeasure>>
  baseSeedRef: React.MutableRefObject<number>
  setBeatsInMeasure: (n: number) => void
  setBeatIndex: (i: number | null) => void
  setHitMap: React.Dispatch<React.SetStateAction<Record<number, number[]>>>
  setMissMap: React.Dispatch<React.SetStateAction<Record<number, number[]>>>
  setStrayMap: React.Dispatch<React.SetStateAction<Record<number, number[]>>>
  setPulse: React.Dispatch<React.SetStateAction<{ idx: number; n: number } | null>>
  setStageNotif: (s: string | null) => void
  setBpmNotif: (n: number | null) => void
  setBpm: (n: number) => void
  onGameOver: () => void
  scheduleMeasure: (absIdx: number) => void
  beatIndex: number | null
}

export function nextSuccessfulMeasureCount(
  currentCount: number,
  missedMeasureLoopIdxs: Set<number>,
  completedLoopIdx: number,
): number {
  return missedMeasureLoopIdxs.has(completedLoopIdx) ? currentCount : currentCount + 1
}

export function useGameLoop({
  phase,
  cfg,
  currentBeatsInMeasureRef,
  bpmRef,
  reelRef,
  setReelSnapshot,
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
  missedMeasureLoopIdxsRef,
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
  onGameOver,
  scheduleMeasure,
  beatIndex,
}: UseGameLoopArgs): void {
  // ── RAF-driven reel scroll ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return

    let rafId: number
    const frame = () => {
      const now = performance.now()
      // Frozen while review modal or user pause is active
      if (pausedRef.current || userPausedRef.current) {
        lastFrameTimeRef.current = 0
        rafId = requestAnimationFrame(frame)
        return
      }
      const mspM    = msPerMeasure(bpmRef.current)
      const vpWidth = reelViewportRef.current?.offsetWidth ?? window.innerWidth

      if (lastFrameTimeRef.current > 0) {
        reelPxRef.current += (now - lastFrameTimeRef.current) * (SLOT_PX / mspM)
      }
      lastFrameTimeRef.current = now

      if (reelTrackRef.current) {
        const totalLoopPx = SLOT_COUNT * SLOT_PX
        const tx = vpWidth * CURSOR_FRAC - (reelPxRef.current % totalLoopPx)
        reelTrackRef.current.style.transform = `translateX(${tx}px)`
      }

      const measuresScrolled = reelPxRef.current / SLOT_PX
      const absIdx  = Math.floor(measuresScrolled)
      const loopIdx = absIdx % SLOT_COUNT

      cursorLoopIdxRef.current = loopIdx
      if (loopIdx !== prevMeasureLoopIdxRef.current) {
        prevMeasureLoopIdxRef.current = loopIdx
        const nextBeats = reelRef.current[loopIdx]?.timeSigTop ?? 4
        currentBeatsInMeasureRef.current = nextBeats
        setBeatsInMeasure(nextBeats)
      }

      const curBeats    = reelRef.current[loopIdx]?.timeSigTop ?? 4
      const measurePhase = measuresScrolled - absIdx
      const newBeatIdx   = Math.floor(measurePhase * curBeats) % curBeats
      if (newBeatIdx !== prevBeatIndexRef.current) {
        prevBeatIndexRef.current = newBeatIdx
        setBeatIndex(newBeatIdx)
      }

      const curStageIdx = getConceptStageIndex(absIdx, modeRef.current)
      if (curStageIdx !== prevStageRef.current && prevStageRef.current >= 0) {
        prevStageRef.current = curStageIdx
        const stageName = getConceptStageName(absIdx, modeRef.current)
        setStageNotif(stageName)
        if (stageNotifTimerRef.current) window.clearTimeout(stageNotifTimerRef.current)
        stageNotifTimerRef.current = window.setTimeout(() => setStageNotif(null), 4000)
      }

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
        setHitMap(prev  => { const n = {...prev};  for (const s of staleSlots) delete n[s]; return n })
        setMissMap(prev => { const n = {...prev};  for (const s of staleSlots) delete n[s]; return n })
        setStrayMap(prev => { const n = {...prev}; for (const s of staleSlots) delete n[s]; return n })
        setReelSnapshot([...reelRef.current])
        for (const s of staleSlots) missedMeasureLoopIdxsRef.current.delete(s)
      }

      for (let a = absIdx; a <= absIdx + 3; a++) {
        const alreadyScheduled = pendingRef.current.some(p => p.measureAbsIdx === a)
        if (!alreadyScheduled) scheduleMeasure(a)
      }

      const hitWindowPx = HIT_WINDOW_MS * (SLOT_PX / mspM)
      for (const onset of pendingRef.current) {
        if (onset.resolved) continue
        if (reelPxRef.current > onset.duePx + hitWindowPx) {
          onset.resolved = true
          consecutiveMissesRef.current++
          missedMeasureLoopIdxsRef.current.add(onset.measureLoopIdx)
          mistakenAbsMeasuresRef.current.set(onset.measureAbsIdx, reelRef.current[onset.measureLoopIdx])
          setMissMap(prev => {
            const ex = prev[onset.measureLoopIdx] ?? []
            if (ex.includes(onset.eventIndex)) return prev
            return { ...prev, [onset.measureLoopIdx]: [...ex, onset.eventIndex] }
          })
          if (consecutiveMissesRef.current >= cfg.consecutiveMissesReset) {
            onGameOver()
            return
          }
        }
      }

      const completed = absIdx - 1
      if (completed > prevCompletedRef.current && completed >= 0) {
        prevCompletedRef.current = completed
        const compLoopIdx = completed % SLOT_COUNT
        const nextCount = nextSuccessfulMeasureCount(
          successfulMeasuresRef.current,
          missedMeasureLoopIdxsRef.current,
          compLoopIdx,
        )
        if (nextCount !== successfulMeasuresRef.current) {
          successfulMeasuresRef.current = nextCount
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
            tickEngine.startMetronome(newBpm, undefined, undefined, currentBeatsInMeasureRef.current)
          }
        }
      }

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
  }, [beatIndex, cursorLoopIdxRef, phase, setPulse])
}
