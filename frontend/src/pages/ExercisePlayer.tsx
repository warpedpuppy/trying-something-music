import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { AttemptMode, AttemptResult, Exercise } from '../api/types'
import { Metronome } from '../components/Metronome'
import { RhythmPlayback } from '../components/RhythmPlayback'
import { RhythmStaff } from '../components/RhythmStaff'
import type { DotMarker } from '../components/RhythmStaff'
import { TapButton } from '../components/TapButton'
import { useTapCapture } from '../hooks/useTapCapture'
import { tickEngine } from '../lib/audio'
import { expectedOnsets, tapsToPattern } from '../lib/rhythm'

type Phase = 'idle' | 'count-in' | 'capturing' | 'submitting' | 'result'

export function ExercisePlayer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [mode, setMode] = useState<AttemptMode>('free')
  const [countInBeat, setCountInBeat] = useState<number | null>(null)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [lastTaps, setLastTaps] = useState<number[]>([])
  const [staffWidth, setStaffWidth] = useState<number | undefined>()
  const [showPlayed, setShowPlayed] = useState(false)
  const [showGiveUpModal, setShowGiveUpModal] = useState(false)
  const downbeatEpochRef = useRef(0)
  const captureOpenTimerRef = useRef<number | null>(null)

  const onsets = useMemo(() => (exercise ? expectedOnsets(exercise.pattern) : []), [exercise])

  const clearCaptureOpenTimer = useCallback(() => {
    if (captureOpenTimerRef.current !== null) {
      window.clearTimeout(captureOpenTimerRef.current)
      captureOpenTimerRef.current = null
    }
  }, [])

  const submitAttempt = useCallback(
    async (tapsMs: number[], gaveUp: boolean, attemptMode: AttemptMode) => {
      if (!exercise) return
      setPhase('submitting')
      try {
        const attempt = await api.submitAttempt(exercise.id, tapsMs, gaveUp, attemptMode)
        setResult(attempt)
        setPhase('result')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not submit your attempt')
        setPhase('idle')
      }
    },
    [exercise],
  )

  const tapCapture = useTapCapture({
    expectedTaps: exercise?.tap_count ?? Infinity,
    onTap: () => tickEngine.tick('tap'),
    onComplete: (tapsMs) => {
      tickEngine.stopMetronome()
      setLastTaps(tapsMs)
      const reported =
        mode === 'strict' ? tapsMs.map((tap) => tap - downbeatEpochRef.current) : tapsMs
      void submitAttempt(reported, false, mode)
    },
  })
  const { reset: resetCapture } = tapCapture

  useEffect(() => {
    let cancelled = false
    setExercise(null)
    setResult(null)
    setError(null)
    setPhase('idle')
    setShowPlayed(false)
    setShowGiveUpModal(false)
    setCountInBeat(null)
    resetCapture()
    api
      .getExercise(Number(id))
      .then((data) => { if (!cancelled) setExercise(data) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load') })
    return () => {
      cancelled = true
      clearCaptureOpenTimer()
      tickEngine.cancelAll()
    }
  }, [id, resetCapture, clearCaptureOpenTimer])

  function handleStart() {
    if (!exercise) return
    setResult(null)
    setShowPlayed(false)
    setCountInBeat(null)

    if (mode === 'free') {
      setPhase('capturing')
      tapCapture.start()
      return
    }

    const countInBeats = exercise.time_sig_top < 4
      ? exercise.time_sig_top * 2
      : exercise.time_sig_top
    const beatMs = 60000 / exercise.tempo_bpm
    setPhase('count-in')

    tickEngine.startMetronome(
      exercise.tempo_bpm,
      (index, wallTimeMs) => {
        if (index < countInBeats) setCountInBeat(index + 1)

        if (index === countInBeats - 1) {
          downbeatEpochRef.current = wallTimeMs + beatMs
          clearCaptureOpenTimer()
          captureOpenTimerRef.current = window.setTimeout(() => tapCapture.start(), beatMs / 2)
        }

        if (index === countInBeats) {
          setCountInBeat(null)
          setPhase('capturing')
        }
      },
    )
  }

  function handleGiveUp() {
    if (!exercise) return
    clearCaptureOpenTimer()
    tickEngine.cancelAll()
    tapCapture.reset()
    setCountInBeat(null)
    setShowGiveUpModal(true)
    // Submit immediately — localStorage API is synchronous so there's no perceptible delay.
    void submitAttempt([], true, mode)
  }

  function handleTryAgain() {
    clearCaptureOpenTimer()
    tickEngine.cancelAll()
    setResult(null)
    setShowPlayed(false)
    setShowGiveUpModal(false)
    setCountInBeat(null)
    tapCapture.reset()
    setPhase('idle')
  }

  async function handleNext() {
    try {
      const next = await api.getNextExercise()
      if (next.exercise_id !== null && next.exercise_id !== exercise?.id) {
        navigate(`/rhythm/exercises/${next.exercise_id}`)
      } else if (next.exercise_id !== null) {
        handleTryAgain()
      } else {
        navigate('/rhythm/exercises')
      }
    } catch {
      navigate('/rhythm/exercises')
    }
  }

  const tapLabel =
    phase === 'idle' ? 'START' :
    phase === 'count-in' ? (countInBeat !== null ? String(countInBeat) : '…') :
    phase === 'capturing' ? 'TAP' :
    phase === 'result' ? 'AGAIN' :
    '…'

  const tapSublabel =
    phase === 'capturing' && exercise
      ? `${tapCapture.taps.length} / ${exercise.tap_count}`
      : undefined

  const tapDisabled = phase === 'count-in' || phase === 'submitting'

  function handleTapButton() {
    if (phase === 'idle') handleStart()
    else if (phase === 'capturing') tapCapture.tap()
    else if (phase === 'result') handleTryAgain()
  }

  if (error && !exercise) {
    return (
      <div>
        <p className="error-text">{error}</p>
        <Link to="/rhythm/exercises" className="button-secondary">Back to exercises</Link>
      </div>
    )
  }
  if (!exercise) return <p className="page-loading">Loading exercise…</p>

  const dots: DotMarker[] = []
  if (phase === 'result' && result && !result.gave_up) {
    for (const note of result.note_results) {
      const onset = onsets[note.index]
      if (onset) {
        dots.push({ eventIndex: onset.eventIndex, kind: note.verdict, label: note.verdict.replace('_', ' ') })
      }
    }
  }

  const showMetronome = phase === 'count-in' || (phase === 'capturing' && mode === 'strict')

  const inferredMsPerBeat = result?.inferred_bpm ? 60000 / result.inferred_bpm : 600

  return (
    <div className="player-wrap">
      {/* Give-up playback modal */}
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

      {/* Title row */}
      <div className="player-header">
        <div>
          <h1>{exercise.title}</h1>
          <p className="muted">
            Level {exercise.level} · {exercise.time_sig_top}/{exercise.time_sig_bottom} ·{' '}
            {exercise.tap_count} taps ·{' '}
            <Link
              to={`/rhythm/learn#${exercise.learn_section}`}
              state={{ returnToExercise: exercise.id }}
            >
              Learn about {exercise.concept.replace('-', ' ')} →
            </Link>
          </p>
        </div>
      </div>

      {/* Compact info row */}
      <div className="player-info-row">
        {showMetronome && <Metronome bpm={exercise.tempo_bpm} running compact />}
        <span className="player-info-text">
          {phase === 'idle' && (
            <span className="muted">{exercise.description || "Tap START when you're ready."}</span>
          )}
          {phase === 'count-in' && (
            <span>
              {mode === 'strict'
                ? `Count-in — start tapping on the downbeat`
                : `Feel the beat at ${exercise.tempo_bpm} BPM, then tap freely`}
            </span>
          )}
          {phase === 'capturing' && (
            <span>
              {mode === 'strict' ? 'Stay locked to the metronome' : 'Tap freely at your own tempo'}
            </span>
          )}
          {phase === 'submitting' && <span className="muted">Checking your rhythm…</span>}
          {phase === 'result' && result && (
            <span className={result.passed ? 'text-success' : 'text-warn'}>
              {!result.gave_up && (
                <strong>{result.passed ? 'Passed!' : 'Not quite.'}{' '}</strong>
              )}
              {result.message}
              {!result.gave_up && (
                <>
                  {' '}Accuracy: {Math.round(result.accuracy * 100)}%
                  {result.mode === 'strict'
                    ? ` — metronome at ${Math.round(result.inferred_bpm ?? exercise.tempo_bpm)} BPM.`
                    : result.inferred_bpm
                      ? ` at ≈${Math.round(result.inferred_bpm)} BPM.`
                      : '.'}
                </>
              )}
            </span>
          )}
        </span>
      </div>

      {/* Staff */}
      <RhythmStaff
        pattern={exercise.pattern}
        timeSigTop={exercise.time_sig_top}
        timeSigBottom={exercise.time_sig_bottom}
        dots={dots}
        onRendered={(width) => setStaffWidth(width)}
      />

      <TapButton
        label={tapLabel}
        sublabel={tapSublabel}
        onTap={handleTapButton}
        disabled={tapDisabled}
        width={staffWidth}
      />

      {phase === 'result' && result && !result.gave_up && (
        <div className="result-legend">
          <span><span className="legend-swatch" style={{ background: '#2e9e5b' }} /> on time</span>
          <span><span className="legend-swatch" style={{ background: '#e0a73c' }} /> early / late</span>
          <span><span className="legend-swatch" style={{ background: '#d9534f' }} /> wrong</span>
          <span><span className="legend-swatch" style={{ background: '#9aa0a6' }} /> missed</span>
        </div>
      )}

      <div className="player-controls">
        {(phase === 'capturing' || phase === 'count-in') && (
          <button type="button" className="button-secondary" onClick={handleTryAgain}>Cancel</button>
        )}
        {phase === 'result' && (
          <>
            <button type="button" className="button-secondary" onClick={() => void handleNext()}>
              Next exercise →
            </button>
            {result?.gave_up && (
              <button type="button" className="button-secondary" onClick={() => setShowGiveUpModal(true)}>
                Hear it again
              </button>
            )}
          </>
        )}
        {(phase === 'idle' || phase === 'capturing' || phase === 'result') && (
          <button type="button" className="button-danger" onClick={handleGiveUp}>
            I give up — play it for me
          </button>
        )}
      </div>

      {(phase === 'idle' || phase === 'result') && (
        <fieldset className="mode-toggle">
          <legend>Difficulty</legend>
          <label className={mode === 'free' ? 'selected' : ''}>
            <input type="radio" name="attempt-mode" value="free" checked={mode === 'free'} onChange={() => setMode('free')} />
            Free tempo — you set the speed
          </label>
          <label className={mode === 'strict' ? 'selected' : ''}>
            <input type="radio" name="attempt-mode" value="strict" checked={mode === 'strict'} onChange={() => setMode('strict')} />
            With the metronome — count-in, then stay on its beat
          </label>
        </fieldset>
      )}

      {phase === 'result' && result && !result.gave_up && !result.passed && lastTaps.length > 1 && (
        <div className="played-back">
          <button type="button" className="link-button" onClick={() => setShowPlayed((v) => !v)}>
            {showPlayed ? 'Hide' : 'Show'} what you actually played
          </button>
          {showPlayed && (
            <RhythmStaff
              pattern={tapsToPattern(lastTaps, inferredMsPerBeat)}
              timeSigTop={exercise.time_sig_top}
              timeSigBottom={exercise.time_sig_bottom}
              caption="Your taps, written out as notation (approximate)."
            />
          )}
        </div>
      )}
    </div>
  )
}
