import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { AttemptResult, Exercise } from '../api/types'
import { Metronome } from '../components/Metronome'
import { RhythmPlayback } from '../components/RhythmPlayback'
import { RhythmStaff } from '../components/RhythmStaff'
import type { DotMarker } from '../components/RhythmStaff'
import { TapButton } from '../components/TapButton'
import { useTapCapture } from '../hooks/useTapCapture'
import { usePageTitle } from '../hooks/usePageTitle'
import { tickEngine } from '../lib/audio'
import { expectedOnsets, tapsToPattern } from '../lib/rhythm'
import { scoreTapsStrict } from '../lib/scoring'

type Phase = 'idle' | 'count-in' | 'capturing' | 'submitting' | 'result'

export function ExercisePlayer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [countInBeat, setCountInBeat] = useState<number | null>(null)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [lastTaps, setLastTaps] = useState<number[]>([])
  const [staffWidth, setStaffWidth] = useState<number | undefined>()
  const [showPlayed, setShowPlayed] = useState(false)
  const [showGiveUpModal, setShowGiveUpModal] = useState(false)
  const [downbeatNonce, setDownbeatNonce] = useState<number | null>(null)
  const downbeatEpochRef = useRef(0)
  const captureOpenTimerRef = useRef<number | null>(null)

  usePageTitle(exercise?.title ?? 'Exercise')
  const onsets = useMemo(() => (exercise ? expectedOnsets(exercise.pattern) : []), [exercise])

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
        setError(err instanceof Error ? err.message : 'Could not submit your attempt')
        setPhase('idle')
      }
    },
    [exercise],
  )

  const tapCapture = useTapCapture({
    expectedTaps: exercise?.tap_count ?? Infinity,
    onTap: (tapIndex) => {
      tickEngine.tick('tap')
      // First tap anchors the downbeat: epoch = now - firstBeat * msPerBeat
      // so scoreTapsStrict sees tap 0 landing exactly on its expected beat.
      if (tapIndex === 0 && exercise && onsets.length > 0) {
        const msPerBeat = 60000 / exercise.tempo_bpm
        downbeatEpochRef.current = performance.now() - onsets[0].beat * msPerBeat
      }
    },
    onComplete: (tapsMs) => {
      tickEngine.stopMetronome()
      setLastTaps(tapsMs)
      // Taps are stored relative to the downbeat epoch for fixed-BPM scoring
      const reported = tapsMs.map((tap) => tap - downbeatEpochRef.current)
      void submitAttempt(reported, false)
    },
  })
  const { reset: resetCapture } = tapCapture

  // Shared count-in logic used by both auto-start and AGAIN
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
          // Epoch is NOT set here — it's set on the user's first tap instead,
          // so they can jump in on any beat 1 they choose after the count-in.
          clearCaptureOpenTimer()
          captureOpenTimerRef.current = window.setTimeout(() => tapCapture.start(), beatMs / 2)
        }

        if (index === countInBeats) {
          setCountInBeat(null)
          setPhase('capturing')
        }

        // Pulse the downbeat arrow on each measure-1 beat of the pattern
        if (index >= countInBeats && (index - countInBeats) % ex.time_sig_top === 0) {
          setDownbeatNonce(n => (n ?? 0) + 1)
        }
      },
    )
  // tapCapture.start is a stable ref — intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearCaptureOpenTimer])

  // Load exercise data
  useEffect(() => {
    let cancelled = false
    setExercise(null)
    setResult(null)
    setError(null)
    setPhase('idle')
    setShowPlayed(false)
    setShowGiveUpModal(false)
    setCountInBeat(null)
    setDownbeatNonce(null)
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

  // Auto-start count-in as soon as exercise data arrives
  useEffect(() => {
    if (!exercise) return
    // Warm up AudioContext now (user's navigation gesture) so DSP is ready before first tap
    tickEngine.warmUp()
    startCountIn(exercise)
  }, [exercise, startCountIn])

  function handleStart() {
    if (!exercise) return
    setResult(null)
    setShowPlayed(false)
    startCountIn(exercise)
  }

  function handleGiveUp() {
    if (!exercise) return
    clearCaptureOpenTimer()
    tickEngine.cancelAll()
    tapCapture.reset()
    setCountInBeat(null)
    setShowGiveUpModal(true)
    void submitAttempt([], true)
  }

  // AGAIN button: clean up and restart with a fresh count-in
  function handleTryAgain() {
    clearCaptureOpenTimer()
    tickEngine.cancelAll()
    tapCapture.reset()
    setShowGiveUpModal(false)
    handleStart()
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
    const tapsForScoring = tapCapture.taps.map(t => t - downbeatEpochRef.current)
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
          <button type="button" className="button-danger" onClick={handleGiveUp}>
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
