/**
 * ProgressionPlayer — plays a sequence of chords with visual step highlighting.
 * Used on the Cadences, Progressions, and other theory pages.
 */
import { useState } from 'react'
import { theoryAudio, type ChordStep } from '../lib/theoryAudio'

interface Props {
  steps: readonly ChordStep[]
  /** Label shown on the play button (default "▶ Hear it") */
  buttonLabel?: string
  /** Tempo hint shown below e.g. "in C major" */
  context?: string
}

export function ProgressionPlayer({ steps, buttonLabel = '▶ Hear it', context }: Props) {
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  function handlePlay() {
    if (playing) {
      theoryAudio.stop()
      setPlaying(false)
      setActiveStep(null)
      return
    }
    setPlaying(true)
    setActiveStep(0)
    theoryAudio.playSequence(
      steps as ChordStep[],
      idx => setActiveStep(idx),
      () => { setPlaying(false); setActiveStep(null) },
    )
  }

  return (
    <div className="pp-root">
      {/* Chord chips */}
      <div className="pp-chips">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`pp-chip${activeStep === i ? ' pp-chip-active' : ''}`}
          >
            <span className="pp-chip-label">{step.label ?? '?'}</span>
          </div>
        ))}
      </div>

      <div className="pp-controls">
        <button
          type="button"
          className={`pp-play-btn${playing ? ' pp-playing' : ''}`}
          onClick={handlePlay}
          aria-label={playing ? 'Stop' : 'Play'}
        >
          {playing ? '■ Stop' : buttonLabel}
        </button>
        {context && <span className="pp-context">{context}</span>}
      </div>
    </div>
  )
}
