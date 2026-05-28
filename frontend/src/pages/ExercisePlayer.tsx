import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { AttemptMode, AttemptResult, Exercise } from '../api/types'
import { Metronome } from '../components/Metronome'
import { RhythmStaff } from '../components/RhythmStaff'
import type { DotMarker, NoteAnchor } from '../components/RhythmStaff'
import { TapButton } from '../components/TapButton'
import { useTapCapture } from '../hooks/useTapCapture'
import { tickEngine } from '../lib/audio'
import { buildCountingBeats, expectedOnsets, onsetTimesMs, tapsToPattern } from '../lib/rhythm'
import type { CountingBeat } from '../lib/rhythm'

type Phase = 'idle' | 'count-in' | 'give-up-count-in' | 'capturing' | 'submitting' | 'playback' | 'result'

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
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [countingBeats, setCountingBeats] = useState<CountingBeat[]>([])
  const [hasWatchedGiveUp, setHasWatchedGiveUp] = useState(false)
  const [playheadX, setPlayheadX] = useState<number | null>(null)
  const [staffAnchors, setStaffAnchors] = useState<NoteAnchor[]>([])
  const [showPlayed, setShowPlayed] = useState(false)
  const [staffWidth, setStaffWidth] = useState<number | undefined>()
  const downbeatEpochRef = useRef(0)
  const captureOpenTimerRef = useRef<number | null>(null)
  const playheadRafRef = useRef<number | null>(null)
  const playheadHoldRef = useRef<number | null>(null)
  const playStartWallMsRef = useRef(0)
  const countingTimersRef = useRef<number[]>([])

  const onsets = useMemo(() => (exercise ? expectedOnsets(exercise.pattern) : []), [exercise])

  const clearCaptureOpenTimer = useCallback(() => {
    if (captureOpenTimerRef.current !== null) {
      window.clearTimeout(captureOpenTimerRef.current)
      captureOpenTimerRef.current = null
    }
  }, [])

  function clearCountingTimers() {
    for (const t of countingTimersRef.current) clearTimeout(t)
    countingTimersRef.current = []
  }

  // Smoothly animate the playhead through each note's pixel position, then sweep
  // to the right edge over sweepToEndMs, then call onEnd.
  function startSmoothPlayhead(
    playStartWallMs: number,
    offsets: number[],
    anchors: NoteAnchor[],
    noteOnsets: typeof onsets,
    staffEndX: number,
    sweepToEndMs: number,
    onEnd: () => void,
  ) {
    if (playheadRafRef.current !== null) cancelAnimationFrame(playheadRafRef.current)
    if (playheadHoldRef.current !== null) clearTimeout(playheadHoldRef.current)

    // Build waypoints: [timeMs from playback start, x pixel position]
    const waypoints: Array<[number, number]> = offsets.map((t, i) => {
      const x = anchors.find(a => a.eventIndex === noteOnsets[i]?.eventIndex)?.x ?? anchors[0]?.x ?? 0
      return [t, x]
    })

    // Final waypoint: sweep from last note to right edge over sweepToEndMs
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
    setPlayingIndex(null)
    setCountingBeats([])
    setHasWatchedGiveUp(false)
    setPlayheadX(null)
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
      for (const t of countingTimersRef.current) clearTimeout(t)
      countingTimersRef.current = []
    }
  }, [id, resetCapture, clearCaptureOpenTimer])

  function handleStart() {
    if (!exercise) return
    setResult(null)
    setShowPlayed(false)
    setPlayingIndex(null)
    stopPlayheadAnim()
    setCountInBeat(null)

    if (mode === 'free') {
      // Free tempo: start capturing immediately, no count-in
      setPhase('capturing')
      tapCapture.start()
      return
    }

    // Strict mode: full count-in at exercise tempo, then keep metronome running
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

  function handleGiveUp(withCounting = false) {
    if (!exercise) return
    clearCaptureOpenTimer()
    tickEngine.cancelAll()
    stopPlayheadAnim()
    tapCapture.reset()
    setResult(null)
    setShowPlayed(false)
    setCountInBeat(null)
    clearCountingTimers()
    setCountingBeats([])
    setPhase('give-up-count-in')

    const countInBeats = exercise.time_sig_top
    const beatMs = 60000 / exercise.tempo_bpm
    const offsets = onsetTimesMs(exercise.pattern, exercise.tempo_bpm)
    // capture these so the metronome callback closes over stable values
    const anchorsAtStart = staffAnchors
    const onsetsAtStart = onsets
    const staffEndX = (staffWidth ?? 200) - 10

    tickEngine.startMetronome(
      exercise.tempo_bpm,
      (index, wallTimeMs) => {
        if (index < countInBeats) {
          setCountInBeat(index + 1)
        }

        if (index === countInBeats - 1) {
          const startDelayMs = Math.max(50, wallTimeMs + beatMs - performance.now())
          // Record the exact wall time the first note will sound
          playStartWallMsRef.current = performance.now() + startDelayMs
          tickEngine.playSchedule(
            offsets,
            (noteIndex) => { setPlayingIndex(noteIndex) },
            () => {
              tickEngine.stopMetronome()
              setPlayingIndex(null)
            },
            600,
            startDelayMs,
          )
          // Schedule one setTimeout per subdivision to reveal counting words
          if (withCounting) {
            const subdivisions = buildCountingBeats(exercise.pattern, exercise.tempo_bpm, exercise.time_sig_top)
            for (const sub of subdivisions) {
              const tid = window.setTimeout(() => {
                setCountingBeats(prev => [...prev, sub])
              }, startDelayMs + sub.offsetMs)
              countingTimersRef.current.push(tid)
            }
          }
        }

        if (index === countInBeats) {
          setPhase('playback')
          setCountInBeat(null)
          startSmoothPlayhead(
            playStartWallMsRef.current,
            offsets,
            anchorsAtStart,
            onsetsAtStart,
            staffEndX,
            beatMs,                               // sweep to right edge over one beat
            () => { setHasWatchedGiveUp(true); void submitAttempt([], true, mode) },
          )
        }
      },
    )
  }

  function handleTryAgain() {
    clearCaptureOpenTimer()
    tickEngine.cancelAll()
    clearCountingTimers()
    setResult(null)
    setShowPlayed(false)
    setPlayingIndex(null)
    setCountingBeats([])
    setHasWatchedGiveUp(false)
    stopPlayheadAnim()
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
    (phase === 'count-in' || phase === 'give-up-count-in') ? (countInBeat !== null ? String(countInBeat) : '…') :
    phase === 'capturing' ? 'TAP' :
    phase === 'result' ? 'AGAIN' :
    '…'

  const tapSublabel =
    phase === 'capturing' && exercise
      ? `${tapCapture.taps.length} / ${exercise.tap_count}`
      : undefined

  const tapDisabled =
    phase === 'count-in' || phase === 'give-up-count-in' || phase === 'submitting' || phase === 'playback'

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
  if (phase === 'playback' && playingIndex !== null && onsets[playingIndex]) {
    dots.push({ eventIndex: onsets[playingIndex].eventIndex, kind: 'playing' })
  }
  if (phase === 'result' && result && !result.gave_up) {
    for (const note of result.note_results) {
      const onset = onsets[note.index]
      if (onset) {
        dots.push({ eventIndex: onset.eventIndex, kind: note.verdict, label: note.verdict.replace('_', ' ') })
      }
    }
  }

  const showMetronome =
    phase === 'count-in' ||
    phase === 'give-up-count-in' ||
    phase === 'playback' ||
    (phase === 'capturing' && mode === 'strict')

  const inferredMsPerBeat = result?.inferred_bpm ? 60000 / result.inferred_bpm : 600

  return (
    <div className="player-wrap">
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

      {/* Compact info row: small metronome + status text on the same line */}
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
          {phase === 'give-up-count-in' && <span>Counting in — the answer plays on the downbeat…</span>}
          {phase === 'playback' && <span>Listen — hear how the rhythm fits the underlying beat.</span>}
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
        playheadX={playheadX}
        onRendered={(width, anchors) => { setStaffWidth(width); setStaffAnchors(anchors) }}
      />

      {countingBeats.length > 0 && (
        <p className="playback-count-label">
          {countingBeats.map((beat, i) => (
            <span key={i} style={{ color: beat.hasNote ? '#f97316' : 'var(--muted)' }}>
              {i > 0 ? ' ' : ''}{beat.label}
            </span>
          ))}
        </p>
      )}

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
        {(phase === 'capturing' || phase === 'count-in' || phase === 'give-up-count-in' || phase === 'playback') && (
          <button type="button" className="button-secondary" onClick={handleTryAgain}>Cancel</button>
        )}
        {phase === 'result' && (
          <button type="button" className="button-secondary" onClick={() => void handleNext()}>
            Next exercise →
          </button>
        )}
        {(phase === 'idle' || phase === 'capturing' || phase === 'result') && (
          <button type="button" className="button-danger" onClick={() => handleGiveUp()}>
            I give up — play it for me
          </button>
        )}
      </div>

      {phase === 'result' && result?.gave_up && hasWatchedGiveUp && (
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <button type="button" className="button-secondary" onClick={() => handleGiveUp(true)}>
            Watch playback with counting
          </button>
          <p className="counting-replay-note">
            We didn't show the counting on first play so you could focus on reading the notation.
          </p>
        </div>
      )}

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
