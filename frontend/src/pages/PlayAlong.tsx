import { useCallback, useEffect, useRef, useState } from 'react'
import { renderPattern } from '../lib/vexflowPattern'
import { generateReel, type GeneratedMeasure } from '../lib/rhythmGenerator'
import { tickEngine } from '../lib/audio'

// ── Reel configuration ────────────────────────────────────────────────────────

const SLOT_PX = 380          // fixed pixel width of every rendered measure
const REEL_UNIQUE = 24       // how many unique measures to generate before looping

// Build once at module load — deterministic, no re-generation on re-render
const REEL_LIBRARY: GeneratedMeasure[] = generateReel(REEL_UNIQUE, 1337)
// Double for seamless CSS loop
const REEL: GeneratedMeasure[] = [...REEL_LIBRARY, ...REEL_LIBRARY]

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'welcome' | 'bpm-setup' | 'playing'

// ── Main component ────────────────────────────────────────────────────────────

export function PlayAlong() {
  const [stage, setStage] = useState<Stage>('welcome')
  const [bpm, setBpm] = useState(80)
  const [beatIndex, setBeatIndex] = useState<number | null>(null)
  const [tapFlash, setTapFlash] = useState(false)
  const tapFlashTimer = useRef<number | null>(null)

  const msPerMeasure = (4 * 60000) / bpm
  const reelDurationMs = REEL_UNIQUE * msPerMeasure

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
              timeSigTop={item.timeSigTop}
              timeSigBottom={item.timeSigBottom}
              label={item.label}
              level={item.level}
              showClef={item.showClef}
              showTimeSig={item.showTimeSig}
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

// ── Welcome screen ────────────────────────────────────────────────────────────

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
        <li>Patterns get gradually more challenging — and the time signature changes!</li>
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

// ── Notation block ────────────────────────────────────────────────────────────

interface NotationBlockProps {
  events: import('../api/types').PatternEvent[]
  timeSigTop: number
  timeSigBottom: number
  label: string
  level: number
  showClef: boolean
  showTimeSig: boolean
}

function NotationBlock({ events, timeSigTop, timeSigBottom, label, level, showClef, showTimeSig }: NotationBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try {
      renderPattern(el, { events }, timeSigTop, timeSigBottom, {
        fixedTotalWidth: SLOT_PX,
        showClef,
        showTimeSignature: showTimeSig,
      })
    } catch {
      // silently ignore render errors (e.g. in test environments)
    }
  // Each block's props are stable references from the REEL constant
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
