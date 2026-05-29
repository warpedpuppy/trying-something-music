/**
 * SamplePlayer — lightweight exercise player used on the Learn page.
 *
 * Available to logged-out users; no server round-trip.  Scoring is done
 * entirely client-side via scoreTapsFree.
 *
 * The "I give up" experience uses the same <RhythmPlayback> modal as
 * ExercisePlayer so both code paths are always identical.  If you change
 * the modal UI, change it once in RhythmPlayback.tsx.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Pattern } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Metronome } from './Metronome'
import { RhythmPlayback } from './RhythmPlayback'
import { RhythmStaff } from './RhythmStaff'
import type { DotMarker } from './RhythmStaff'
import { TapButton } from './TapButton'
import { useTapCapture } from '../hooks/useTapCapture'
import { tickEngine } from '../lib/audio'
import { expectedOnsets, tapCount } from '../lib/rhythm'
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

type Phase = 'idle' | 'count-in' | 'capturing' | 'result'

export function SamplePlayer({ exercise }: { exercise: SampleExercise }) {
  const { user } = useAuth()
  const [phase, setPhase]           = useState<Phase>('idle')
  const [result, setResult]         = useState<ScoreResult | null>(null)
  const [countInBeat, setCountInBeat] = useState<number | null>(null)
  const [staffWidth, setStaffWidth] = useState<number | undefined>()
  const [showGiveUpModal, setShowGiveUpModal] = useState(false)

  const captureOpenTimerRef = useRef<number | null>(null)

  const onsets = useMemo(() => expectedOnsets(exercise.pattern), [exercise.pattern])
  const taps   = tapCount(exercise.pattern)

  const clearCaptureTimer = useCallback(() => {
    if (captureOpenTimerRef.current !== null) {
      window.clearTimeout(captureOpenTimerRef.current)
      captureOpenTimerRef.current = null
    }
  }, [])

  useEffect(() => () => {
    clearCaptureTimer()
    tickEngine.cancelAll()
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
    setCountInBeat(null)
    tapCapture.reset()

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
          clearCaptureTimer()
          captureOpenTimerRef.current = window.setTimeout(() => tapCapture.start(), beatMs / 2)
          window.setTimeout(() => {
            setCountInBeat(null)
            setPhase('capturing')
          }, beatMs)
        }
      },
      countInBeats, // stopAfterBeats — plays exactly countInBeats clicks, no more
    )
  }

  // ── Give-up: stop everything and open the shared RhythmPlayback modal ──────

  function handleGiveUp() {
    clearCaptureTimer()
    tickEngine.cancelAll()
    tapCapture.reset()
    setCountInBeat(null)
    setPhase('idle')
    setShowGiveUpModal(true)
  }

  function handleReset() {
    clearCaptureTimer()
    tickEngine.cancelAll()
    tapCapture.reset()
    setPhase('idle')
    setResult(null)
    setCountInBeat(null)
  }

  // ── Tap button label / behaviour ──────────────────────────────────────────

  const tapLabel =
    phase === 'idle'     ? 'START' :
    phase === 'count-in' ? (countInBeat !== null ? String(countInBeat) : '…') :
    phase === 'capturing' ? 'TAP' :
    phase === 'result'   ? 'AGAIN' : '…'

  const tapSublabel = phase === 'capturing'
    ? `${tapCapture.taps.length} / ${taps}`
    : undefined

  const tapDisabled = phase === 'count-in'

  function handleTapButton() {
    if (phase === 'idle')      handleStart()
    else if (phase === 'capturing') tapCapture.tap()
    else if (phase === 'result')    handleReset()
  }

  // ── Dot overlays on the staff ────────────────────────────────────────────

  const dots: DotMarker[] = useMemo(() => {
    if (phase === 'result' && result) {
      return result.noteResults.flatMap((note) => {
        const onset = onsets[note.index]
        return onset
          ? [{ eventIndex: onset.eventIndex, kind: note.verdict, label: note.verdict.replace('_', ' ') }]
          : []
      })
    }
    return []
  }, [phase, result, onsets])

  const showMetronome = phase === 'count-in'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="player-wrap">

      {/* Give-up modal — identical to ExercisePlayer's modal */}
      {showGiveUpModal && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowGiveUpModal(false) }}
        >
          <div className="modal-panel">
            <div className="modal-header">
              <h2 className="modal-title">Hear the rhythm</h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setShowGiveUpModal(false)}
              >
                ✕
              </button>
            </div>
            <RhythmPlayback
              pattern={exercise.pattern}
              timeSigTop={exercise.time_sig_top}
              timeSigBottom={exercise.time_sig_bottom}
              bpm={exercise.tempo_bpm}
              onClose={() => setShowGiveUpModal(false)}
            />
          </div>
        </div>
      )}

      {/* Compact info row: small metronome + status text */}
      <div className="player-info-row">
        {showMetronome && <Metronome bpm={exercise.tempo_bpm} running compact />}
        <span className="player-info-text">
          {phase === 'idle' && <span className="muted">{exercise.hint}</span>}
          {phase === 'count-in' && (
            <span>Feel the beat at {exercise.tempo_bpm} BPM, then tap freely</span>
          )}
          {phase === 'capturing' && <span className="muted">Tap freely at your own tempo.</span>}
          {phase === 'result' && result && (
            <span className={result.passed ? 'text-success' : 'text-warn'}>
              <strong>{result.passed ? 'Passed!' : 'Not quite.'}</strong>{' '}
              Accuracy: {Math.round(result.accuracy * 100)}%.{' '}
              {result.passed
                ? 'Great feel for the rhythm.'
                : 'The dots show where each tap landed.'}
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

      {/* Login nudge — only when logged out and a result is showing */}
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
