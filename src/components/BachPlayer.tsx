/**
 * BachPlayer — two-voice polyphonic player for Bach Invention No. 1 (BWV 772).
 *
 * Displays a simple two-staff diagram where notes light up as they play.
 * Voice 0 = right hand (treble, shown on top row).
 * Voice 1 = left hand (bass, shown on bottom row).
 */
import { useState } from 'react'
import { theoryAudio, BACH_INVENTION_1, BACH_INVENTION_1_DURATION_SEC } from '../lib/theoryAudio'

// MIDI → note name (just letter + octave, no accidentals needed for C major)
const NOTE_NAMES: Record<number, string> = {}
const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
for (let m = 36; m <= 96; m++) {
  const oct = Math.floor(m / 12) - 1
  NOTE_NAMES[m] = NAMES[m % 12] + oct
}

export function BachPlayer() {
  const [playing, setPlaying]       = useState(false)
  const [activeRH, setActiveRH]     = useState<number | null>(null)   // midi
  const [activeLH, setActiveLH]     = useState<number | null>(null)   // midi
  const [barIndex, setBarIndex]     = useState<number | null>(null)   // 0-3

  function handlePlay() {
    if (playing) {
      theoryAudio.stop()
      setPlaying(false)
      setActiveRH(null)
      setActiveLH(null)
      setBarIndex(null)
      return
    }
    setPlaying(true)

    theoryAudio.playPolyphonic(
      BACH_INVENTION_1,
      (startSec, voice, midi) => {
        // Which bar? (each bar = 16 16th notes × 0.1875s = 3s)
        const bar = Math.floor(startSec / (16 * 0.1875))
        setBarIndex(bar)
        if (voice === 0) setActiveRH(midi)
        else             setActiveLH(midi)
      },
      () => {
        setPlaying(false)
        setActiveRH(null)
        setActiveLH(null)
        setBarIndex(null)
      },
    )
  }

  const barLabels = ['Bar 1 — RH alone', 'Bar 2 — LH enters', 'Bar 3 — contrary motion', 'Bar 4 — sequence']

  return (
    <div className="bach-player">
      <div className="bach-header">
        <div>
          <h4 className="bach-title">
            J.S. Bach — Invention No. 1 in C Major (BWV 772)
          </h4>
          <p className="bach-subtitle">
            Opening 4 bars · public domain · voice 0 = right hand, voice 1 = left hand
          </p>
        </div>
        <button
          type="button"
          className={`pp-play-btn${playing ? ' pp-playing' : ''}`}
          onClick={handlePlay}
          aria-label={playing ? 'Stop' : 'Play Bach Invention No. 1'}
        >
          {playing ? '■ Stop' : '▶ Play Bach'}
        </button>
      </div>

      {/* Bar progress indicator */}
      <div className="bach-bars">
        {[0, 1, 2, 3].map(b => (
          <div key={b} className={`bach-bar-chip${barIndex === b ? ' bach-bar-active' : ''}`}>
            {barLabels[b]}
          </div>
        ))}
      </div>

      {/* Voice display */}
      <div className="bach-voices">
        <div className="bach-voice bach-voice-rh">
          <span className="bach-voice-label">Right hand</span>
          <span className={`bach-note${activeRH !== null ? ' bach-note-active' : ''}`}>
            {activeRH !== null ? NOTE_NAMES[activeRH] ?? '—' : '—'}
          </span>
        </div>
        <div className="bach-voice bach-voice-lh">
          <span className="bach-voice-label">Left hand</span>
          <span className={`bach-note${activeLH !== null ? ' bach-note-active' : ''}`}>
            {activeLH !== null ? NOTE_NAMES[activeLH] ?? '—' : '—'}
          </span>
        </div>
      </div>

      <p className="bach-caption">
        Notice how the two voices move <strong>independently</strong> — sometimes in contrary
        motion (opposite directions), sometimes in parallel. This is the essence of counterpoint.
        The left hand imitates the right hand's opening motive one bar later.
        Duration: ~{Math.round(BACH_INVENTION_1_DURATION_SEC)}s at 80 BPM.
      </p>
    </div>
  )
}
