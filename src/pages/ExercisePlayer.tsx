import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Exercise } from '../api/types'
import { Metronome } from '../components/Metronome'
import { RhythmStaff } from '../components/RhythmStaff'
import { ExerciseGiveUpModal } from './exercise/ExerciseGiveUpModal'
import { useExerciseSession } from './exercise/useExerciseSession'
import type { DotMarker } from '../components/RhythmStaff'
import { TapButton } from '../components/TapButton'
import { usePageTitle } from '../hooks/usePageTitle'
import { expectedOnsets, tapsToPattern } from '../lib/rhythm'
import { scoreTapsStrict } from '../lib/scoring'

export function ExercisePlayer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [staffWidth, setStaffWidth] = useState<number | undefined>()
  const [showPlayed, setShowPlayed] = useState(false)
  const [showGiveUpModal, setShowGiveUpModal] = useState(false)

  const {
    phase,
    countInBeat,
    result,
    lastTaps,
    downbeatNonce,
    downbeatEpoch,
    tapCapture,
    handleGiveUp,
    handleTryAgain,
  } = useExerciseSession({ exerciseId: id, exercise })

  usePageTitle(exercise?.title ?? 'Exercise')
  const onsets = useMemo(() => (exercise ? expectedOnsets(exercise.pattern) : []), [exercise])

  // Load exercise data
  useEffect(() => {
    let cancelled = false
    api
      .getExercise(Number(id))
      .then((data) => {
        if (cancelled) return
        setError(null)
        setShowPlayed(false)
        setShowGiveUpModal(false)
        setExercise(data)
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load') })
    return () => {
      cancelled = true
    }
  }, [id])

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
    phase === 'count-in' ? (countInBeat !== null ? String(countInBeat) : '…') :
    phase === 'capturing' ? 'TAP' :
    phase === 'result' ? 'AGAIN' :
    '…'

  const tapSublabel =
    phase === 'capturing' && exercise
      ? tapCapture.taps.length === 0
        ? 'tap on beat 1'
        : `${tapCapture.taps.length} / ${exercise.tap_count}`
      : undefined

  const tapDisabled = phase === 'count-in' || phase === 'submitting'

  function handleTapButton() {
    if (phase === 'capturing') tapCapture.tap()
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

  // Real-time dots: use the same fixed-BPM algorithm as the final scoring so
  // what you see during capture always matches the end result.
  const dots: DotMarker[] = []
  if (phase === 'capturing' && tapCapture.taps.length > 0) {
    const expectedBeats = onsets.map(o => o.beat)
    const tapsForScoring = tapCapture.taps.map(t => t - downbeatEpoch)
    const liveScore = scoreTapsStrict(expectedBeats, tapsForScoring, 60000 / exercise.tempo_bpm)
    for (const note of liveScore.noteResults) {
      if (note.verdict === 'missed') continue
      const onset = onsets[note.index]
      if (onset) dots.push({ eventIndex: onset.eventIndex, kind: note.verdict })
    }
  } else if (phase === 'result' && result && !result.gave_up) {
    for (const note of result.note_results) {
      const onset = onsets[note.index]
      if (onset) {
        dots.push({ eventIndex: onset.eventIndex, kind: note.verdict, label: note.verdict.replace('_', ' ') })
      }
    }
  }

  const inferredMsPerBeat = result?.inferred_bpm ? 60000 / result.inferred_bpm : 600

  return (
    <div className="player-wrap">
      <ExerciseGiveUpModal
        exercise={exercise}
        open={showGiveUpModal}
        onClose={() => setShowGiveUpModal(false)}
      />

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
        {(phase === 'count-in' || phase === 'capturing') && (
          <Metronome bpm={exercise.tempo_bpm} running compact />
        )}
        <span className="player-info-text">
          {phase === 'count-in' && (
            <span>Count-in at {exercise.tempo_bpm} BPM — start tapping on any beat 1</span>
          )}
          {phase === 'capturing' && (
            <span>
              {tapCapture.taps.length === 0
                ? 'Tap on beat 1 when you\'re ready'
                : 'Stay locked to the metronome'}
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
                  {` at ${exercise.tempo_bpm} BPM.`}
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
        downbeatNonce={downbeatNonce ?? undefined}
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
          <span><span className="legend-swatch" style={{ background: '#2e9e5b' }} /> hit</span>
          <span><span className="legend-swatch" style={{ background: '#f97316' }} /> missed</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 900, fontSize: '13px', lineHeight: 1 }}>✕</span> wrong
          </span>
        </div>
      )}

      <div className="player-controls">
        {(phase === 'capturing' || phase === 'count-in') && (
          <button type="button" className="button-secondary" onClick={handleTryAgain}>Restart</button>
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
        {(phase === 'capturing' || phase === 'result') && (
          <button type="button" className="button-danger" onClick={() => { handleGiveUp(); setShowGiveUpModal(true); }}>
            I give up — play it for me
          </button>
        )}
      </div>

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
