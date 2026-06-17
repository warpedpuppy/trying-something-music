import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import type { AttemptResult, Exercise } from '../../api/types'
import { tickEngine } from '../../lib/audio'
import { expectedOnsets } from '../../lib/rhythm'
import type { UseTapCaptureReturn } from '../../hooks/useTapCapture'

type Phase = 'idle' | 'count-in' | 'capturing' | 'submitting' | 'result'

interface UseExerciseSessionArgs {
  exerciseId: string | undefined
  exercise: Exercise | null
  tapCapture: UseTapCaptureReturn
}

interface UseExerciseSessionReturn {
  phase: Phase
  countInBeat: number | null
  result: AttemptResult | null
  lastTaps: number[]
  downbeatNonce: number | null
  submitAttempt: (tapsMs: number[], gaveUp: boolean) => Promise<void>
  startCountIn: (ex: Exercise) => void
  handleStart: () => void
  handleGiveUp: () => void
  handleTryAgain: () => void
}

export function useExerciseSession({
  exerciseId,
  exercise,
  tapCapture,
}: UseExerciseSessionArgs): UseExerciseSessionReturn {
  const [phase, setPhase] = useState<Phase>('idle')
  const [countInBeat, setCountInBeat] = useState<number | null>(null)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [lastTaps, setLastTaps] = useState<number[]>([])
  const [downbeatNonce, setDownbeatNonce] = useState<number | null>(null)

  const downbeatEpochRef = useRef(0)
  const captureOpenTimerRef = useRef<number | null>(null)

  const clearCaptureOpenTimer = useCallback(() => {
    if (captureOpenTimerRef.current !== null) {
      window.clearTimeout(captureOpenTimerRef.current)
      captureOpenTimerRef.current = null
    }
  }, [])

  const submitAttempt = useCallback(
    async (tapsMs: number[], gaveUp: boolean) => {
      if (!exercise) return
      setPhase('submitting')
      try {
        const attempt = await api.submitAttempt(exercise.id, tapsMs, gaveUp, 'strict')
        setResult(attempt)
        setPhase('result')
      } catch (err) {
        setPhase('idle')
      }
    },
    [exercise],
  )

  const startCountIn = useCallback((ex: Exercise) => {
    const countInBeats = ex.time_sig_top < 4 ? ex.time_sig_top * 2 : ex.time_sig_top
    const beatMs = 60000 / ex.tempo_bpm
    setDownbeatNonce(0)
    setPhase('count-in')
    setCountInBeat(null)

    tickEngine.startMetronome(
      ex.tempo_bpm,
      (index, _wallTimeMs) => {
        if (index < countInBeats) setCountInBeat(index + 1)

        if (index === countInBeats - 1) {
          clearCaptureOpenTimer()
          captureOpenTimerRef.current = window.setTimeout(() => tapCapture.start(), beatMs / 2)
        }

        if (index === countInBeats) {
          setCountInBeat(null)
          setPhase('capturing')
        }

        if (index >= countInBeats && (index - countInBeats) % ex.time_sig_top === 0) {
          setDownbeatNonce(n => (n ?? 0) + 1)
        }
      },
    )
  // tapCapture.start is a stable ref — intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearCaptureOpenTimer])

  const handleStart = useCallback(() => {
    if (!exercise) return
    setResult(null)
    startCountIn(exercise)
  }, [exercise, startCountIn])

  const handleGiveUp = useCallback(() => {
    if (!exercise) return
    clearCaptureOpenTimer()
    tickEngine.cancelAll()
    tapCapture.reset()
    setCountInBeat(null)
    void submitAttempt([], true)
  }, [exercise, clearCaptureOpenTimer, tapCapture, submitAttempt])

  const handleTryAgain = useCallback(() => {
    clearCaptureOpenTimer()
    tickEngine.cancelAll()
    tapCapture.reset()
    handleStart()
  }, [clearCaptureOpenTimer, tapCapture, handleStart])

  // Load exercise data and auto-start
  useEffect(() => {
    let cancelled = false
    setPhase('idle')
    setResult(null)
    setCountInBeat(null)
    setDownbeatNonce(null)
    tapCapture.reset()

    return () => {
      cancelled = true
      clearCaptureOpenTimer()
      tickEngine.cancelAll()
    }
  }, [exerciseId, tapCapture, clearCaptureOpenTimer])

  // Auto-start count-in when exercise arrives
  useEffect(() => {
    if (!exercise) return
    tickEngine.warmUp()
    startCountIn(exercise)
  }, [exercise, startCountIn])

  return {
    phase,
    countInBeat,
    result,
    lastTaps,
    downbeatNonce,
    submitAttempt,
    startCountIn,
    handleStart,
    handleGiveUp,
    handleTryAgain,
  }
}
