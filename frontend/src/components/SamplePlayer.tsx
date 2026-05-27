import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Pattern } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Metronome } from './Metronome'
import { RhythmStaff } from './RhythmStaff'
import type { DotMarker } from './RhythmStaff'
import { TapButton } from './TapButton'
import { useTapCapture } from '../hooks/useTapCapture'
import { tickEngine } from '../lib/audio'
import { expectedOnsets, onsetTimesMs, tapCount } from '../lib/rhythm'
import { scoreTapsFree } from '../lib/scoring'
import type { ScoreResult } from '../lib/scoring'

export interface SampleExercise {
  title: string
  description: string
  hint: string
  time_sig_top: number
  time_sig_bottom: number
  tempo_bpm: number
  pattern: Pattern
}

type Phase = 'idle' | 'count-in' | 'capturing' | 'playback' | 'result'

export function SamplePlayer({ exercise }: { exercise: SampleExercise }) {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [countInBeat, setCountInBeat] = useState<number | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [staffWidth, setStaffWidth] = useState<number | undefined>()
  const captureOpenTimerRef = useRef<number | null>(null)

  const onsets = useMemo(() => expectedOnsets(exercise.pattern), [exercise.pattern])
  const taps = tapCount(exercise.pattern)

  const clearCaptureTimer = useCallback(() => {
    if (captureOpenTimerRef.current !== null) {
      window.clearTimeout(captureOpenTimerRef.current)
      captureOpenTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearCaptureTimer()
      tickEngine.cancelAll()
    }
  }, [clearCaptureTimer])

  const handleComplete = useCallback(
    (tapsMs: number[]) => {
      tickEngine.stopMetronome()
      const expectedBeats = onsets.map((o) => o.beat)
      const scored = scoreTapsFree(expectedBeats, tapsMs)
      setResult(scored)
      setPhase('result')
    },
    [onsets],
  )

  const tapCapture = useTapCapture({
    expectedTaps: taps,
    onTap: () => tickEngine.tick('tap'),
    onComplete: handleComplete,
  })

  function handleStart() {
    setResult(null)
    setPlayingIndex(null)
    setCountInBeat(null)
    tapCapture.reset()

    // Count-in length: numerator of time sig; doubled when numerator < 4
    const countInBeats = exercise.time_sig_top < 4
      ? exercise.time_sig_top * 2
      : exercise.time_sig_top
    const beatMs = 60000 / exercise.tempo_bpm
    setPhase('count-in')

    tickEngine.startMetronome(
      exercise.tempo_bpm,
      (index) => {
        if (index < countInBeats) setCountInBeat(index + 1)

        if (index === countInBeats - 1) {
          // Last beat: open capture window, then transition phase via timer
          clearCaptureTimer()
          captureOpenTimerRef.current = window.setTimeout(() => tapCapture.start(), beatMs / 2)
          window.setTimeout(() => {
            setCountInBeat(null)
            setPhase('capturing')
          }, beatMs)
        }
        // index === countInBeats is never reached: stopAfterBeats = countInBeats
      },
      countInBeats, // stopAfterBeats — plays exactly countInBeats clicks, no more
    )
  }

  function handleGiveUp() {
    clearCaptureTimer()
    tickEngine.stopMetronome()
    tapCapture.reset()
    setResult(null)
    setCountInBeat(null)
    setPhase('playback')
    const offsets = onsetTimesMs(exercise.pattern, exercise.tempo_bpm)
    tickEngine.playSchedule(
      offsets,
      (i) => setPlayingIndex(i),
      () => {
        setPlayingIndex(null)
        setPhase('idle')
      },
    )
  }

  function handleReset() {
    clearCaptureTimer()
    tickEngine.cancelAll()
    tapCapture.reset()
    setPhase('idle')
    setResult(null)
    setCountInBeat(null)
    setPlayingIndex(null)
  }

  const tapLabel =
    phase === 'idle' ? 'START' :
    phase === 'count-in' ? (countInBeat !== null ? String(countInBeat) : '…') :
    phase === 'capturing' ? 'TAP' :
    phase === 'result' ? 'AGAIN' :
    '…'

  const tapSublabel =
    phase === 'capturing' ? `${tapCapture.taps.length} / ${taps}` : undefined

  const tapDisabled = phase === 'count-in' || phase === 'playback'

  function handleTapButton() {
    if (phase === 'idle') handleStart()
    else if (phase === 'capturing') tapCapture.tap()
    else if (phase === 'result') handleReset()
  }

  const dots: DotMarker[] = useMemo(() => {
    if (phase === 'playback' && playingIndex !== null && onsets[playingIndex]) {
      return [{ eventIndex: onsets[playingIndex].eventIndex, kind: 'playing' }]
    }
    if (phase === 'result' && result) {
      return result.noteResults.flatMap((note) => {
        const onset = onsets[note.index]
        return onset
          ? [{ eventIndex: onset.eventIndex, kind: note.verdict, label: note.verdict.replace('_', ' ') }]
          : []
      })
    }
    return []
  }, [phase, playingIndex, result, onsets])

  const showMetronome = phase === 'count-in'

  return (
    <div className="player-wrap">
      {/* Compact info row: small metronome + status on the same line */}
      <div className="player-info-row">
        {showMetronome && <Metronome bpm={exercise.tempo_bpm} running compact />}
        <span className="player-info-text">
          {phase === 'idle' && <span className="muted">{exercise.hint}</span>}
          {phase === 'count-in' && <span>Feel the beat at {exercise.tempo_bpm} BPM, then tap freely</span>}
          {phase === 'capturing' && <span className="muted">Tap freely at your own tempo.</span>}
          {phase === 'playback' && <span>Listen — this is the rhythm the notation is asking for.</span>}
          {phase === 'result' && result && (
            <span className={result.passed ? 'text-success' : 'text-warn'}>
              <strong>{result.passed ? 'Passed!' : 'Not quite.'}</strong>{' '}
              Accuracy: {Math.round(result.accuracy * 100)}%.{' '}
              {result.passed ? 'Great feel for the rhythm.' : 'The dots show where each tap landed.'}
            </span>
          )}
        </span>
      </div>

      <RhythmStaff
        pattern={exercise.pattern}
        timeSigTop={exercise.time_sig_top}
        timeSigBottom={exercise.time_sig_bottom}
        dots={dots}
        onRendered={setStaffWidth}
      />

      <TapButton
        label={tapLabel}
        sublabel={tapSublabel}
        onTap={handleTapButton}
        disabled={tapDisabled}
        width={staffWidth}
      />

      {phase === 'result' && result && !result.passed && (
        <div className="result-legend">
          <span><span className="legend-swatch" style={{ background: '#2e9e5b' }} /> on time</span>
          <span><span className="legend-swatch" style={{ background: '#e0a73c' }} /> early / late</span>
          <span><span className="legend-swatch" style={{ background: '#d9534f' }} /> wrong</span>
          <span><span className="legend-swatch" style={{ background: '#9aa0a6' }} /> missed</span>
        </div>
      )}

      <div className="player-controls">
        {(phase === 'capturing' || phase === 'count-in') && (
          <button type="button" className="button-secondary" onClick={handleReset}>Cancel</button>
        )}
        {(phase === 'idle' || phase === 'capturing' || phase === 'result') && (
          <button type="button" className="button-danger" onClick={handleGiveUp}>
            I give up — play it for me
          </button>
        )}
      </div>

      {/* Login nudge — only when logged out and exercise is finished */}
      {phase === 'result' && !user && (
        <div className="sample-login-nudge">
          <Link to="/register" className="button-primary">
            Log in for more exercises →
          </Link>
        </div>
      )}
    </div>
  )
}
