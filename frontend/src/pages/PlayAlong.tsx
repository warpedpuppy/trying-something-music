import { useCallback, useEffect, useRef, useState } from 'react'
import type { PatternEvent } from '../api/types'
import { renderPattern } from '../lib/vexflowPattern'
import { tickEngine } from '../lib/audio'

// ── helpers ──────────────────────────────────────────────────────────────────

function n(
  duration: PatternEvent['duration'],
  dots = 0,
  tie = false,
): PatternEvent {
  const e: PatternEvent = { type: 'note', duration }
  if (dots) e.dots = dots
  if (tie) e.tieToNext = true
  return e
}

function r(duration: PatternEvent['duration'], dots = 0): PatternEvent {
  const e: PatternEvent = { type: 'rest', duration }
  if (dots) e.dots = dots
  return e
}

// ── pattern library (20 measures, 5 levels × 4 patterns) ─────────────────────
//    All 4/4, single measure. Each entry is verified to sum to 4 beats.

interface ReelMeasure { events: PatternEvent[]; label: string; level: number }

const REEL_LIBRARY: ReelMeasure[] = [
  // Level 1 — steady quarters & halves
  { level: 1, label: 'Steady',         events: [n('q'), n('q'), n('q'), n('q')] },
  { level: 1, label: 'Two halves',     events: [n('h'), n('h')] },
  { level: 1, label: 'Lead-in',        events: [n('h'), n('q'), n('q')] },
  { level: 1, label: 'Build-up',       events: [n('q'), n('q'), n('h')] },

  // Level 2 — eighth-note pairs
  { level: 2, label: 'Walk & run',     events: [n('q'), n('q'), n('8'), n('8'), n('q')] },
  { level: 2, label: 'Running start',  events: [n('8'), n('8'), n('8'), n('8'), n('q'), n('q')] },
  { level: 2, label: 'Step-step',      events: [n('q'), n('8'), n('8'), n('q'), n('q')] },
  { level: 2, label: 'Pickup',         events: [n('8'), n('8'), n('q'), n('q'), n('q')] },

  // Level 3 — dotted notes & quarter rests
  { level: 3, label: 'Long-short',     events: [n('q', 1), n('8'), n('q'), n('q')] },
  { level: 3, label: 'Double long-short', events: [n('q', 1), n('8'), n('q', 1), n('8')] },
  { level: 3, label: 'Gap on 2',       events: [n('q'), r('q'), n('q'), n('q')] },
  { level: 3, label: 'Late start',     events: [r('q'), n('q'), n('q'), n('q')] },

  // Level 4 — syncopation
  { level: 4, label: 'Off the beat',   events: [n('8'), n('q'), n('q'), n('q'), n('8')] },
  { level: 4, label: 'Backbeat',       events: [r('8'), n('8'), r('8'), n('8'), n('h')] },
  { level: 4, label: 'Anticipation',   events: [n('q', 1), n('8', 0, true), n('h')] },
  { level: 4, label: 'Lean in',        events: [n('q'), r('8'), n('8'), n('q'), n('q')] },

  // Level 5 — sixteenths
  { level: 5, label: 'Sixteenth run',  events: [n('16'), n('16'), n('16'), n('16'), n('q'), n('8'), n('8'), n('q')] },
  { level: 5, label: 'Gallop',         events: [n('8', 1), n('16'), n('8', 1), n('16'), n('8', 1), n('16'), n('8', 1), n('16')] },
  { level: 5, label: 'Mixed',          events: [n('8'), n('16'), n('16'), n('q'), n('16'), n('16'), n('8'), n('q')] },
  { level: 5, label: 'All off-beats',  events: [r('8'), n('8'), r('8'), n('8'), r('8'), n('8'), r('8'), n('8')] },
]

// Double the list for a seamless CSS animation loop.
// The animation scrolls through the first N, then loops back to the start.
const REEL = [...REEL_LIBRARY, ...REEL_LIBRARY]

const SLOT_PX = 380          // fixed pixel width of every rendered measure
const REEL_HALF = REEL_LIBRARY.length   // 20 — one full cycle of difficulty

// ── types ─────────────────────────────────────────────────────────────────────

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

  if (stage === 'welcome') return <WelcomeScreen onStart={() => setStage('bpm-setup')} />
  if (stage === 'bpm-setup') return <BpmSetup bpm={bpm} setBpm={setBpm} onStart={startPlaying} />

  return (
    <div className="pa-playing">
      {/* Beat dots */}
      <div className="pa-beat-row" aria-label="Beat indicator">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`pa-beat-dot${beatIndex === i ? ' active' : ''}`} />
        ))}
      </div>
      <p className="pa-bpm-label">{bpm} BPM</p>

      {/* Scrolling notation reel */}
      <div className="pa-reel-viewport">
        <div className="pa-cursor-line" aria-hidden="true" />
        <div
          className="pa-reel-track"
          style={{
            width: `${REEL.length * SLOT_PX}px`,
            animationDuration: `${reelDurationMs}ms`,
          }}
        >
          {REEL.map((item, i) => (
            <NotationBlock
              key={i}
              events={item.events}
              label={item.label}
              level={item.level}
            />
          ))}
        </div>
      </div>

      {/* Tap button */}
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
        Sheet music scrolls past from right to left — tap along with the metronome.
        No pressure, no score: just feel the rhythm.
      </p>
      <ul className="pa-welcome-bullets">
        <li>Pick a tempo that feels comfortable</li>
        <li>Watch the notation scroll by</li>
        <li>Tap the big button on every note</li>
        <li>Patterns get gradually more challenging</li>
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

  const speedLabel =
    bpm < 70 ? 'Very slow' :
    bpm < 90 ? 'Slow' :
    bpm < 110 ? 'Moderate' :
    bpm < 140 ? 'Upbeat' : 'Fast'

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
        type="range" min="40" max="200" value={bpm}
        onChange={e => { setBpm(Number(e.target.value)); tapTimesRef.current = []; setTapCount(0) }}
        className="pa-bpm-slider"
        aria-label="Tempo in BPM"
      />
      <div className="pa-slider-labels"><span>40</span><span>200</span></div>

      <button type="button" className="pa-tap-tempo-btn" onClick={handleTapTempo}>
        Tap tempo
        {tapCount >= 2 && <span className="pa-tap-hint"> ({tapCount} taps)</span>}
      </button>

      <button type="button" className="btn-primary pa-cta" onClick={onStart}>
        Let's play →
      </button>
    </div>
  )
}

// ── notation block ────────────────────────────────────────────────────────────

interface NotationBlockProps {
  events: PatternEvent[]
  label: string
  level: number
}

function NotationBlock({ events, label, level }: NotationBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try {
      renderPattern(el, { events }, 4, 4, { fixedTotalWidth: SLOT_PX })
    } catch {
      // silently ignore render errors (e.g. in test environments)
    }
  // events is a stable reference from the REEL constant — no need to deep-compare
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const levelDots = '●'.repeat(level) + '○'.repeat(5 - level)

  return (
    <div className="pa-measure-block">
      <div ref={containerRef} className="pa-notation-container" />
      <div className="pa-measure-footer">
        <span className="pa-measure-label">{label}</span>
        <span className="pa-measure-level" aria-label={`Level ${level}`}>{levelDots}</span>
      </div>
    </div>
  )
}
