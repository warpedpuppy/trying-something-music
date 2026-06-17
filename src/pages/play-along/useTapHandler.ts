import { useCallback } from 'react'
import { tickEngine } from '../../lib/audio'
import { msPerMeasure, SLOT_PX } from '../../lib/playAlongTiming'
import { triggerRainbowBurst } from '../../lib/rippleEngine'
import { SLOT_COUNT, HIT_WINDOW_MS } from './constants'
import type { PendingOnset } from '../PlayAlong'

interface UseTapHandlerArgs {
  phase: 'welcome' | 'static' | 'playing' | 'gameover'
  userPausedRef: React.MutableRefObject<boolean>
  tapFlashTimerRef: React.MutableRefObject<number | null>
  tapBtnRef: React.MutableRefObject<HTMLButtonElement | null>
  tapTimesRef: React.MutableRefObject<number[]>
  reelPxRef: React.MutableRefObject<number>
  bpmRef: React.MutableRefObject<number>
  pendingRef: React.MutableRefObject<PendingOnset[]>
  consecutiveMissesRef: React.MutableRefObject<number>
  setTapFlash: (b: boolean) => void
  setHitMap: React.Dispatch<React.SetStateAction<Record<number, number[]>>>
  setStrayMap: React.Dispatch<React.SetStateAction<Record<number, number[]>>>
}

export function useTapHandler({
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
}: UseTapHandlerArgs): () => void {
  return useCallback(() => {
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
  }, [phase, userPausedRef, tapFlashTimerRef, tapBtnRef, tapTimesRef, reelPxRef, bpmRef, pendingRef, consecutiveMissesRef, setTapFlash, setHitMap, setStrayMap])
}
