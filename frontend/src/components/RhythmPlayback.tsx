/**
 * RhythmPlayback — shared component for the "hear it played" experience.
 *
 * Used in two places:
 *   • ExercisePlayer — when the student clicks "I give up — play it for me"
 *   • PlayAlong      — when the student clicks a paused measure for an explanation
 *
 * On mount the component auto-starts a metronome count-in, then plays the
 * pattern audio with a scrolling playhead.  After the first playback completes
 * a "Watch with counting" button appears so the student can replay with the
 * spoken subdivisions visible.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Metronome } from './Metronome'
import { RhythmStaff } from './RhythmStaff'
import type { DotMarker, NoteAnchor } from './RhythmStaff'
import { tickEngine } from '../lib/audio'
import { buildCountingBeats, expectedOnsets, onsetTimesMs, totalBeats } from '../lib/rhythm'
import type { CountingBeat, Onset } from '../lib/rhythm'
import type { Pattern } from '../api/types'

type PlaybackPhase = 'count-in' | 'playing' | 'done'

export interface RhythmPlaybackProps {
  pattern: Pattern
  timeSigTop: number
  timeSigBottom: number
  bpm: number
  /** Optional callback fired once after the very first playback ends. */
  onFirstPlayComplete?: () => void
  /** If provided, a dismiss button is rendered. */
  onClose?: () => void
}

export function RhythmPlayback({
  pattern,
  timeSigTop,
  timeSigBottom,
  bpm,
  onFirstPlayComplete,
  onClose,
}: RhythmPlaybackProps) {
  const [phase, setPhase] = useState<PlaybackPhase>('count-in')
  const [countInBeat, setCountInBeat] = useState<number | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [countingBeats, setCountingBeats] = useState<CountingBeat[]>([])
  const [playheadX, setPlayheadX] = useState<number | null>(null)
  const [hasDoneFirstPlay, setHasDoneFirstPlay] = useState(false)
  const [showCountingArea, setShowCountingArea] = useState(false)

  // Refs so that the metronome callback (stale closure) can always read the
  // latest anchor positions even though they arrive asynchronously via onRendered.
  const staffAnchorsRef = useRef<NoteAnchor[]>([])
  const staffWidthRef = useRef<number>(200)
  // x of the first event (note OR rest) = start of the measure / downbeat.
  const staffFirstEventXRef = useRef<number | null>(null)

  const playheadRafRef = useRef<number | null>(null)
  const playheadHoldRef = useRef<number | null>(null)
  const playStartWallMsRef = useRef(0)
  const countingTimersRef = useRef<number[]>([])

  // Keep a stable ref to the callback so the closure inside startPlay doesn't go stale.
  const onFirstPlayCompleteRef = useRef(onFirstPlayComplete)
  onFirstPlayCompleteRef.current = onFirstPlayComplete

  const onsets = useMemo(() => expectedOnsets(pattern), [pattern])

  // ── helpers ──────────────────────────────────────────────────────────────

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

    // Build (timeMs, x) waypoints — one per note onset.
    const waypoints: Array<[number, number]> = offsets.map((t, i) => {
      const anchor = anchors.find((a) => a.eventIndex === noteOnsets[i]?.eventIndex)
      const x = anchor?.x ?? anchors[0]?.x ?? 0
      return [t, x]
    })
    // Leading waypoint: if the measure starts with a rest (first onset after t=0),
    // begin the sweep at the start of the measure so the line travels through the
    // rest rather than jumping straight to the first note.
    const startX = staffFirstEventXRef.current
    if (startX != null && waypoints.length > 0 && waypoints[0][0] > 0) {
      waypoints.unshift([0, startX])
    }
    // Final waypoint: sweep to the right edge.
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

  // ── core play function ────────────────────────────────────────────────────

  function startPlay(withCounting: boolean, isFirstPlay: boolean) {
    tickEngine.cancelAll()
    stopPlayheadAnim()
    clearCountingTimers()
    setCountingBeats([])
    setPlayingIndex(null)
    setCountInBeat(null)
    setPhase('count-in')
    setShowCountingArea(withCounting)
    // Park the playhead at the start of the measure (downbeat) — the first event's
    // x whether it's a note or a rest — so the orange line always begins at count one.
    setPlayheadX(staffFirstEventXRef.current ?? staffAnchorsRef.current[0]?.x ?? 0)

    const countInBeats = timeSigTop
    const beatMs = 60000 / bpm
    const offsets = onsetTimesMs(pattern, bpm)

    // Tail long enough to let the metronome finish the measure — critical for
    // whole notes (offset[last]=0, so the default 600 ms cut it off after beat 1).
    const measureDurationMs = totalBeats(pattern) * beatMs
    const lastOnsetMs = offsets.length > 0 ? offsets[offsets.length - 1] : 0
    const tailMs = Math.max(600, measureDurationMs - lastOnsetMs + 100)

    tickEngine.startMetronome(bpm, (index, wallTimeMs) => {
      // Count-in display
      if (index < countInBeats) {
        setCountInBeat(index + 1)
      }

      // On the last count-in beat: schedule audio + counting labels
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

      // Downbeat — switch to playing phase and start playhead
      if (index === countInBeats) {
        setPhase('playing')
        setCountInBeat(null)

        startSmoothPlayhead(
          playStartWallMsRef.current,
          offsets,
          staffAnchorsRef.current,
          onsets,
          staffWidthRef.current - 10,
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

  // ── lifecycle ─────────────────────────────────────────────────────────────

  // Auto-start on mount.
  useEffect(() => {
    startPlay(false, true)
    return () => {
      tickEngine.cancelAll()
      stopPlayheadAnim()
      clearCountingTimers()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── render ────────────────────────────────────────────────────────────────

  const dots: DotMarker[] = []
  if (phase === 'playing' && playingIndex !== null && onsets[playingIndex]) {
    dots.push({ eventIndex: onsets[playingIndex].eventIndex, kind: 'playing' })
  }

  const isActive = phase === 'count-in' || phase === 'playing'

  return (
    <div className="rp-wrap">
      {/* Metronome + status on one line */}
      <div className="rp-status-row">
        <Metronome bpm={bpm} running={isActive} compact />
        <p className="rp-status-text">
          {phase === 'count-in' && (countInBeat !== null ? `Count-in — ${countInBeat}` : 'Counting in…')}
          {phase === 'playing' && 'Listen carefully.'}
          {phase === 'done' && (hasDoneFirstPlay ? 'Playback complete.' : '')}
        </p>
      </div>

      {/* Staff */}
      <div className="rp-staff-wrap">
        <RhythmStaff
          pattern={pattern}
          timeSigTop={timeSigTop}
          timeSigBottom={timeSigBottom}
          dots={dots}
          playheadX={playheadX}
          onRendered={(width, anchors, firstEventX) => {
            staffWidthRef.current = width
            staffAnchorsRef.current = anchors
            staffFirstEventXRef.current = firstEventX ?? null
          }}
        />
      </div>

      {showCountingArea && (
        <p className="playback-count-label">
          {countingBeats.length === 0
            ? <span className="rp-count-placeholder">counting will appear here</span>
            : countingBeats.map((beat, i) => (
                <span key={i} style={{ color: beat.hasNote ? '#f97316' : 'var(--muted)' }}>
                  {i > 0 ? ' ' : ''}{beat.label}
                </span>
              ))
          }
        </p>
      )}

      {/* Action buttons — all on one row */}
      <div className="rp-actions">
        {phase === 'done' && hasDoneFirstPlay && (
          <>
            <button
              type="button"
              className="button-secondary small"
              onClick={() => { startPlay(false, false) }}
            >
              Play again
            </button>
            <button
              type="button"
              className="button-secondary small"
              onClick={() => { startPlay(true, false) }}
            >
              Watch with counting
            </button>
          </>
        )}
        {onClose && (
          <button type="button" className="button-secondary small" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  )
}
