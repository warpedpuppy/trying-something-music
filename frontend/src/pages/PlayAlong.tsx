import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Pattern } from '../api/types'
import { expectedOnsets } from '../lib/rhythm'
import { tickEngine } from '../lib/audio'

// ── curated single-measure 4/4 patterns for the reel ────────────────────────

const REEL_PATTERNS: Array<{ pattern: Pattern; label: string }> = [
  {
    label: 'Steady quarters',
    pattern: { events: [
      { type: 'note', duration: 'q' },
      { type: 'note', duration: 'q' },
      { type: 'note', duration: 'q' },
      { type: 'note', duration: 'q' },
    ]},
  },
  {
    label: 'Half + quarters',
    pattern: { events: [
      { type: 'note', duration: 'h' },
      { type: 'note', duration: 'q' },
      { type: 'note', duration: 'q' },
    ]},
  },
  {
    label: 'Long-short',
    pattern: { events: [
      { type: 'note', duration: 'q', dots: 1 },
      { type: 'note', duration: '8' },
      { type: 'note', duration: 'q', dots: 1 },
      { type: 'note', duration: '8' },
    ]},
  },
  {
    label: 'Off the beat',
    pattern: { events: [
      { type: 'note', duration: '8' },
      { type: 'note', duration: 'q' },
      { type: 'note', duration: 'q' },
      { type: 'note', duration: 'q' },
      { type: 'note', duration: '8' },
    ]},
  },
  {
    label: 'Off-beat 8ths',
    pattern: { events: [
      { type: 'rest', duration: '8' },
      { type: 'note', duration: '8' },
      { type: 'rest', duration: '8' },
      { type: 'note', duration: '8' },
      { type: 'rest', duration: '8' },
      { type: 'note', duration: '8' },
      { type: 'rest', duration: '8' },
      { type: 'note', duration: '8' },
    ]},
  },
  {
    label: 'Gallop',
    pattern: { events: [
      { type: 'note', duration: '8', dots: 1 },
      { type: 'note', duration: '16' },
      { type: 'note', duration: '8', dots: 1 },
      { type: 'note', duration: '16' },
      { type: 'note', duration: '8', dots: 1 },
      { type: 'note', duration: '16' },
      { type: 'note', duration: '8', dots: 1 },
      { type: 'note', duration: '16' },
    ]},
  },
]

// Double the list for a seamless CSS animation loop
const REEL = [...REEL_PATTERNS, ...REEL_PATTERNS]
const REEL_HALF = REEL_PATTERNS.length

// Each measure slot is this many pixels wide in the scrolling track
const SLOT_PX = 260

type Stage = 'welcome' | 'bpm-setup' | 'playing'

// ── main component ────────────────────────────────────────────────────────────

export function PlayAlong() {
  const [stage, setStage] = useState<Stage>('welcome')
  const [bpm, setBpm] = useState(80)
  const [beatIndex, setBeatIndex] = useState<number | null>(null)
  const [tapFlash, setTapFlash] = useState(false)
  const tapFlashTimer = useRef<number | null>(null)

  const msPerMeasure = (4 * 60000) / bpm
  const reelDurationMs = REEL_HALF * msPerMeasure

  function startPlaying() {
    tickEngine.cancelAll()
    tickEngine.startMetronome(bpm, (index) => setBeatIndex(index % 4))
    setStage('playing')
  }

  function stopPlaying() {
    tickEngine.cancelAll()
    setBeatIndex(null)
    setStage('bpm-setup')
  }

  function handleTap() {
    tickEngine.tick('tap')
    setTapFlash(true)
    if (tapFlashTimer.current) window.clearTimeout(tapFlashTimer.current)
    tapFlashTimer.current = window.setTimeout(() => setTapFlash(false), 130)
  }

  useEffect(() => () => { tickEngine.cancelAll() }, [])

  if (stage === 'welcome') {
    return <WelcomeScreen onStart={() => setStage('bpm-setup')} />
  }

  if (stage === 'bpm-setup') {
    return <BpmSetup bpm={bpm} setBpm={setBpm} onStart={startPlaying} />
  }

  const reelStyle = {
    width: `${REEL.length * SLOT_PX}px`,
    animationDuration: `${reelDurationMs}ms`,
  } satisfies CSSProperties

  return (
    <div className="pa-playing">
      <div className="pa-beat-row" aria-label="Beat indicator">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`pa-beat-dot${beatIndex === i ? ' active' : ''}`} />
        ))}
      </div>
      <p className="pa-bpm-label">{bpm} BPM</p>

      <div className="pa-reel-viewport">
        <div className="pa-cursor-line" aria-hidden="true" />
        <div className="pa-reel-track" style={reelStyle}>
          {REEL.map((item, i) => (
            <MeasureBlock key={i} pattern={item.pattern} label={item.label} />
          ))}
        </div>
      </div>

      <button
        type="button"
        className={`pa-tap-btn${tapFlash ? ' flash' : ''}`}
        onClick={handleTap}
        onTouchStart={e => { e.preventDefault(); handleTap() }}
        aria-label="Tap"
      >
        TAP
      </button>

      <button type="button" className="link-button pa-stop-btn" onClick={stopPlaying}>
        Stop
      </button>
    </div>
  )
}

// ── welcome screen ────────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="pa-stage pa-welcome">
      <h1 className="pa-welcome-title">Play Along</h1>
      <p className="pa-welcome-body">
        Rhythm patterns scroll past from right to left. Tap along with the metronome
        beat — no pressure, no score, just feel the groove.
      </p>
      <ul className="pa-welcome-bullets">
        <li>Pick a tempo that feels comfortable</li>
        <li>Watch the beat grid scroll by</li>
        <li>Tap the big button to the beat</li>
      </ul>
      <button type="button" className="btn-primary pa-cta" onClick={onStart}>
        Get started
      </button>
    </div>
  )
}

// ── BPM setup ─────────────────────────────────────────────────────────────────

function BpmSetup({ bpm, setBpm, onStart }: {
  bpm: number
  setBpm: (v: number) => void
  onStart: () => void
}) {
  const tapTimesRef = useRef<number[]>([])
  const [tapCount, setTapCount] = useState(0)

  const handleTapTempo = useCallback(() => {
    const now = performance.now()
    const recent = tapTimesRef.current.filter(t => now - t < 3000)
    recent.push(now)
    tapTimesRef.current = recent
    setTapCount(recent.length)
    if (recent.length >= 2) {
      const avg = (recent[recent.length - 1] - recent[0]) / (recent.length - 1)
      setBpm(Math.max(40, Math.min(200, Math.round(60000 / avg))))
    }
  }, [setBpm])

  const speedLabel = bpm < 70 ? 'Very slow' : bpm < 90 ? 'Slow' : bpm < 110 ? 'Moderate' : bpm < 140 ? 'Upbeat' : 'Fast'

  return (
    <div className="pa-stage pa-bpm-setup">
      <h2 className="pa-setup-heading">Set your tempo</h2>
      <p className="pa-setup-hint">Pick a speed that feels comfortable — there's no wrong answer.</p>

      <div className="pa-bpm-display">
        <span className="pa-bpm-number">{bpm}</span>
        <span className="pa-bpm-unit">BPM</span>
      </div>
      <p className="pa-speed-label">{speedLabel}</p>

      <input
        type="range"
        min="40"
        max="200"
        value={bpm}
        onChange={e => { setBpm(Number(e.target.value)); tapTimesRef.current = []; setTapCount(0) }}
        className="pa-bpm-slider"
        aria-label="Tempo in BPM"
      />
      <div className="pa-slider-labels">
        <span>40</span>
        <span>200</span>
      </div>

      <button
        type="button"
        className="pa-tap-tempo-btn"
        onClick={handleTapTempo}
        aria-label="Tap to set tempo"
      >
        Tap tempo
        {tapCount >= 2 && <span className="pa-tap-hint"> ({tapCount} taps)</span>}
      </button>

      <button type="button" className="btn-primary pa-cta" onClick={onStart}>
        Let's play →
      </button>
    </div>
  )
}

// ── measure beat-grid block ───────────────────────────────────────────────────

const SIXTEENTH_GRID = Array.from({ length: 16 }, (_, i) => i * 0.25)

function gridSize(cellIndex: number): 'beat' | 'and' | 'sub' {
  if (cellIndex % 4 === 0) return 'beat'
  if (cellIndex % 4 === 2) return 'and'
  return 'sub'
}

function MeasureBlock({ pattern, label }: { pattern: Pattern; label: string }) {
  const noteSet = new Set(expectedOnsets(pattern).map(o => Math.round(o.beat * 100)))
  return (
    <div className="pa-measure-block">
      <div className="pa-beat-grid">
        {SIXTEENTH_GRID.map((pos, i) => {
          const size = gridSize(i)
          const hasNote = noteSet.has(Math.round(pos * 100))
          return (
            <div
              key={i}
              className={`pa-cell pa-cell-${size}${hasNote ? ' note' : ' rest'}`}
            />
          )
        })}
      </div>
      <p className="pa-measure-label">{label}</p>
    </div>
  )
}
