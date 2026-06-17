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

import { useMemo, useRef } from 'react'
import { Metronome } from './Metronome'
import { RhythmStaff } from './RhythmStaff'
import type { DotMarker, NoteAnchor } from './RhythmStaff'
import { CountingBeatRow } from './rhythm-playback/CountingBeatRow'
import { usePlaybackSession } from './rhythm-playback/usePlaybackSession'
import { expectedOnsets } from '../lib/rhythm'
import type { Pattern } from '../api/types'

export interface RhythmPlaybackProps {
  pattern: Pattern
  timeSigTop: number
  timeSigBottom: number
  bpm: number
  /** Optional callback fired once after the very first playback ends. */
  onFirstPlayComplete?: () => void
}

export function RhythmPlayback({
  pattern,
  timeSigTop,
  timeSigBottom,
  bpm,
  onFirstPlayComplete,
}: RhythmPlaybackProps) {
  const staffAnchorsRef = useRef<NoteAnchor[]>([])
  const staffWidthRef = useRef<number>(200)
  const staffFirstEventXRef = useRef<number | null>(null)
  const staffEndXRef = useRef<number>(190)

  const onsets = useMemo(() => expectedOnsets(pattern), [pattern])

  const {
    phase,
    countInBeat,
    playingIndex,
    countingBeats,
    playheadX,
    showCountingArea,
    hasDoneFirstPlay,
    startPlay,
  } = usePlaybackSession({
    pattern,
    timeSigTop,
    bpm,
    onFirstPlayComplete,
    staffAnchorsRef,
    staffFirstEventXRef,
    staffEndXRef,
    onsets,
  })


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
          onRendered={(width, anchors, firstEventX, staveEndX) => {
            staffWidthRef.current = width
            staffAnchorsRef.current = anchors
            staffFirstEventXRef.current = firstEventX ?? null
            staffEndXRef.current = staveEndX ?? (width - 10)
          }}
        />
      </div>

      {showCountingArea && <CountingBeatRow countingBeats={countingBeats} />}

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
      </div>
    </div>
  )
}
