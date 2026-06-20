import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import type { AttemptResult, Exercise } from '../../api/types'
import { tickEngine } from '../../lib/audio'
import { expectedOnsets } from '../../lib/rhythm'
import { useTapCapture } from '../../hooks/useTapCapture'

type Phase = 'idle' | 'count-in' | 'capturing' | 'submitting' | 'result'

interface UseExerciseSessionArgs {
  exerciseId: string | undefined
  exercise: Exercise | null
}

interface UseExerciseSessionReturn {
  phase: Phase
  countInBeat: number | null
  result: AttemptResult | null
  lastTaps: number[]
  downbeatNonce: number | null
  downbeatEpoch: number
  tapCapture: ReturnType<typeof useTapCapture>
  handleStart: () => void
  handleGiveUp: () => void
  handleTryAgain: () => void
}

export function useExerciseSession({
  exerciseId,
  exercise,
}: UseExerciseSessionArgs): UseExerciseSessionReturn {
  const [phase, setPhase] = useState<Phase>('idle')
  const [countInBeat, setCountInBeat] = useState<number | null>(null)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [lastTaps, setLastTaps] = useState<number[]>([])
  const [downbeatNonce, setDownbeatNonce] = useState<number | null>(null)

  const downbeatEpochRef = useRef(0)
  const captureOpenTimerRef = useRef<number | null>(null)
  const onsets = exercise ? expectedOnsets(exercise.pattern) : []

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

  const tapCapture = useTapCapture({
    expectedTaps: exercise?.tap_count ?? Infinity,
    onTap: (tapIndex) => {
      tickEngine.tick('tap')
      if (tapIndex === 0 && exercise && onsets.length > 0) {
        const msPerBeat = 60000 / exercise.tempo_bpm
        downbeatEpochRef.current = performance.now() - onsets[0].beat * msPerBeat
      }
    },
    onComplete: (tapsMs) => {
      tickEngine.stopMetronome()
      setLastTaps(tapsMs)
      const reported = tapsMs.map((tap) => tap - downbeatEpochRef.current)
      void submitAttempt(reported, false)
    },
  })
  const { reset: resetCapture } = tapCapture

  const startCountIn = useCallback((ex: Exercise) => {
    const countInBeats = ex.time_sig_top < 4
      ? ex.time_sig_top * 2
      : ex.time_sig_top
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
  // tapCapture is a new object reference every render; only .start is used here,
  // and it is a stable useCallback([], []). Including tapCapture would restart
  // the metronome on every beat update, preventing the count-in from completing.
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

  // Load exercise data
  useEffect(() => {
    setPhase('idle')
    setResult(null)
    setCountInBeat(null)
    setDownbeatNonce(null)
    resetCapture()

    return () => {
      clearCaptureOpenTimer()
      tickEngine.cancelAll()
    }
  }, [exerciseId, resetCapture, clearCaptureOpenTimer])

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
    downbeatEpoch: downbeatEpochRef.current,
    tapCapture,
    handleStart,
    handleGiveUp,
    handleTryAgain,
  }
}
