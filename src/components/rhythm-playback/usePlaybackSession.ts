import { useEffect, useRef, useState } from 'react'
import { tickEngine } from '../../lib/audio'
import { buildCountingBeats, onsetTimesMs, totalBeats } from '../../lib/rhythm'
import type { CountingBeat, Onset } from '../../lib/rhythm'
import type { Pattern } from '../../api/types'
import type { NoteAnchor } from '../RhythmStaff'

type PlaybackPhase = 'count-in' | 'playing' | 'done'

interface UsePlaybackSessionArgs {
  pattern: Pattern
  timeSigTop: number
  bpm: number
  onFirstPlayComplete?: () => void
  staffAnchorsRef: React.MutableRefObject<NoteAnchor[]>
  staffFirstEventXRef: React.MutableRefObject<number | null>
  staffEndXRef: React.MutableRefObject<number>
  onsets: Onset[]
}

interface UsePlaybackSessionReturn {
  phase: PlaybackPhase
  countInBeat: number | null
  playingIndex: number | null
  countingBeats: CountingBeat[]
  playheadX: number | null
  showCountingArea: boolean
  hasDoneFirstPlay: boolean
  startPlay: (withCounting: boolean, isFirstPlay: boolean) => void
}

export function usePlaybackSession({
  pattern,
  timeSigTop,
  bpm,
  onFirstPlayComplete,
  staffAnchorsRef,
  staffFirstEventXRef,
  staffEndXRef,
  onsets,
}: UsePlaybackSessionArgs): UsePlaybackSessionReturn {
  const [phase, setPhase] = useState<PlaybackPhase>('count-in')
  const [countInBeat, setCountInBeat] = useState<number | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [countingBeats, setCountingBeats] = useState<CountingBeat[]>([])
  const [playheadX, setPlayheadX] = useState<number | null>(null)
  const [hasDoneFirstPlay, setHasDoneFirstPlay] = useState(false)
  const [showCountingArea, setShowCountingArea] = useState(false)

  const playheadRafRef = useRef<number | null>(null)
  const playheadHoldRef = useRef<number | null>(null)
  const playStartWallMsRef = useRef(0)
  const countingTimersRef = useRef<number[]>([])
  const onFirstPlayCompleteRef = useRef(onFirstPlayComplete)

  useEffect(() => {
    onFirstPlayCompleteRef.current = onFirstPlayComplete
  }, [onFirstPlayComplete])

  function stopPlayheadAnim() {
    if (playheadRafRef.current !== null) {
      cancelAnimationFrame(playheadRafRef.current)
      playheadRafRef.current = null
    }
    if (playheadHoldRef.current !== null) {
      clearTimeout(playheadHoldRef.current)
      playheadHoldRef.current = null
    }
    setPlayheadX(null)
  }

  function clearCountingTimers() {
    for (const t of countingTimersRef.current) clearTimeout(t)
    countingTimersRef.current = []
  }

  function startSmoothPlayhead(
    playStartWallMs: number,
    offsets: number[],
    anchors: NoteAnchor[],
    noteOnsets: Onset[],
    staffEndX: number,
    sweepToEndMs: number,
    onEnd: () => void,
  ) {
    if (playheadRafRef.current !== null) cancelAnimationFrame(playheadRafRef.current)
    if (playheadHoldRef.current !== null) clearTimeout(playheadHoldRef.current)

    const waypoints: Array<[number, number]> = offsets.map((t, i) => {
      const anchor = anchors.find((a) => a.eventIndex === noteOnsets[i]?.eventIndex)
      const x = anchor?.x ?? anchors[0]?.x ?? 0
      return [t, x]
    })
    const startX = staffFirstEventXRef.current
    if (startX != null && waypoints.length > 0 && waypoints[0][0] > 0) {
      waypoints.unshift([0, startX])
    }
    if (waypoints.length > 0) {
      const lastT = waypoints[waypoints.length - 1][0]
      waypoints.push([lastT + sweepToEndMs, staffEndX])
    }
    const totalMs = waypoints[waypoints.length - 1]?.[0] ?? 0

    const step = () => {
      const elapsed = performance.now() - playStartWallMs
      let x: number
      if (waypoints.length === 0) {
        x = staffEndX
      } else if (elapsed <= waypoints[0][0]) {
        x = waypoints[0][1]
      } else {
        let seg = 0
        while (seg < waypoints.length - 2 && waypoints[seg + 1][0] <= elapsed) seg++
        const [t0, x0] = waypoints[seg]
        const [t1, x1] = waypoints[seg + 1]
        const frac = Math.min(1, (elapsed - t0) / (t1 - t0))
        x = x0 + frac * (x1 - x0)
      }
      setPlayheadX(x)
      if (elapsed < totalMs) {
        playheadRafRef.current = requestAnimationFrame(step)
      } else {
        playheadRafRef.current = null
        setPlayheadX(null)
        onEnd()
      }
    }
    playheadRafRef.current = requestAnimationFrame(step)
  }

  function startPlay(withCounting: boolean, isFirstPlay: boolean) {
    tickEngine.cancelAll()
    stopPlayheadAnim()
    clearCountingTimers()
    setCountingBeats([])
    setPlayingIndex(null)
    setCountInBeat(null)
    setPhase('count-in')
    setShowCountingArea(withCounting)
    setPlayheadX(staffFirstEventXRef.current ?? staffAnchorsRef.current[0]?.x ?? 0)

    const countInBeats = timeSigTop
    const beatMs = 60000 / bpm
    const offsets = onsetTimesMs(pattern, bpm)
    const measureDurationMs = totalBeats(pattern) * beatMs
    const lastOnsetMs = offsets.length > 0 ? offsets[offsets.length - 1] : 0
    const tailMs = Math.max(600, measureDurationMs - lastOnsetMs + 100)

    tickEngine.startMetronome(bpm, (index, wallTimeMs) => {
      if (index < countInBeats) {
        setCountInBeat(index + 1)
      }

      if (index === countInBeats - 1) {
        const startDelayMs = Math.max(50, wallTimeMs + beatMs - performance.now())
        playStartWallMsRef.current = performance.now() + startDelayMs

        tickEngine.playSchedule(
          offsets,
          (noteIndex) => { setPlayingIndex(noteIndex) },
          () => {
            tickEngine.stopMetronome()
            setPlayingIndex(null)
          },
          tailMs,
          startDelayMs,
        )

        if (withCounting) {
          const subdivisions = buildCountingBeats(pattern, bpm, timeSigTop)
          for (const sub of subdivisions) {
            const tid = window.setTimeout(() => {
              setCountingBeats((prev) => [...prev, sub])
            }, startDelayMs + sub.offsetMs)
            countingTimersRef.current.push(tid)
          }
        }
      }

      if (index === countInBeats) {
        setPhase('playing')
        setCountInBeat(null)

        startSmoothPlayhead(
          playStartWallMsRef.current,
          offsets,
          staffAnchorsRef.current,
          onsets,
          staffEndXRef.current,
          measureDurationMs - lastOnsetMs,
          () => {
            setPhase('done')
            if (isFirstPlay) {
              setHasDoneFirstPlay(true)
              onFirstPlayCompleteRef.current?.()
            }
          },
        )
      }
    })
  }

  useEffect(() => {
    const id = window.setTimeout(() => startPlay(false, true), 0)
    return () => {
      window.clearTimeout(id)
      tickEngine.cancelAll()
      stopPlayheadAnim()
      clearCountingTimers()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    phase,
    countInBeat,
    playingIndex,
    countingBeats,
    playheadX,
    showCountingArea,
    hasDoneFirstPlay,
    startPlay,
  }
}
