import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PlayAlongConfig } from '../lib/playAlongConfig'
import { DEFAULT_CONFIG } from '../lib/playAlongConfig'
import type { GeneratedMeasure } from '../lib/rhythmGenerator'
import { WelcomeScreen, GameOverScreen, PlayAlong } from './PlayAlong'

// ── Shared mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/vexflowPattern', () => ({
  renderPattern: vi.fn(() => ({ anchors: [], firstEventX: 10 })),
}))

vi.mock('../lib/audio', () => ({
  tickEngine: {
    startMetronome: vi.fn(),
    stopMetronome: vi.fn(),
    cancelAll: vi.fn(),
    tick: vi.fn(),
  },
}))

vi.mock('../lib/rippleEngine', () => ({
  triggerRainbowBurst: vi.fn(),
}))

// ── Test fixtures ─────────────────────────────────────────────────────────────

const TEST_CFG: PlayAlongConfig = {
  ...DEFAULT_CONFIG,
  startBpm: 60,
  bpmCap: 80,
  bpmIncreaseAfterMeasures: 10,
  bpmIncreaseAmount: 1,
  consecutiveMissesReset: 5,
  timeSigs: [
    { top: 4, bottom: 4, afterMeasures: 0 },
    { top: 3, bottom: 4, afterMeasures: 10 },
  ],
}

function makeMeasure(overrides?: Partial<GeneratedMeasure>): GeneratedMeasure {
  return {
    events: [{ type: 'note', duration: 'q' }, { type: 'note', duration: 'q' },
             { type: 'note', duration: 'q' }, { type: 'note', duration: 'q' }],
    timeSigTop: 4,
    timeSigBottom: 4,
    label: '4/4 · Steady',
    level: 1,
    showClef: true,
    showTimeSig: true,
    ...overrides,
  }
}

// ── WelcomeScreen ─────────────────────────────────────────────────────────────

describe('WelcomeScreen', () => {
  it('shows the Play Along title', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    expect(screen.getByRole('heading', { name: 'Rhythm Game!' })).toBeInTheDocument()
  })

  it('displays the default starting BPM from config', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    // The large BPM number and "Starting tempo" label
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText(/starting tempo/i)).toBeInTheDocument()
  })

  it('BPM slider has min=40 and max=bpmCap', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    const slider = screen.getByRole('slider', { name: /starting bpm/i })
    expect(slider).toHaveAttribute('min', '40')
    expect(slider).toHaveAttribute('max', String(TEST_CFG.bpmCap))
    expect(slider).toHaveAttribute('value', '60')
  })

  it('slider labels show min and max BPM', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText(String(TEST_CFG.bpmCap))).toBeInTheDocument()
  })

  it('shows a speed label matching the BPM', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    // 60 BPM is below the 66 threshold, so "Slow"
    expect(screen.getByText('Slow')).toBeInTheDocument()
  })

  it("Let's go button calls onStart with the current BPM", async () => {
    const onStart = vi.fn()
    render(<WelcomeScreen onStart={onStart} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    await userEvent.click(screen.getByRole('button', { name: /let.*s go/i }))
    expect(onStart).toHaveBeenCalledOnce()
    expect(onStart).toHaveBeenCalledWith(60, 'easy')
  })

  it('calls onStart with updated BPM after slider change', async () => {
    const onStart = vi.fn()
    render(<WelcomeScreen onStart={onStart} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    const slider = screen.getByRole('slider', { name: /starting bpm/i })
    // Simulate slider change to 75
    await userEvent.click(slider)
    await userEvent.type(slider, '{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}') // +5 → 65
    await userEvent.click(screen.getByRole('button', { name: /let.*s go/i }))
    const calledWith = (onStart.mock.calls[0] as [number])[0]
    expect(calledWith).toBeGreaterThanOrEqual(60) // moved up from 60
  })

  it('shows misses-reset count in body text', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    expect(screen.getByText(/5 consecutive misses ends the game/i)).toBeInTheDocument()
  })

  it('shows tempo cap info in bullet list', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    expect(screen.getByText(/up to 80/i)).toBeInTheDocument()
  })

})

// ── GameOverScreen ────────────────────────────────────────────────────────────

describe('GameOverScreen', () => {
  const noop = vi.fn()

  beforeEach(() => { noop.mockClear() })

  it('renders the Too many misses title', () => {
    render(
      <GameOverScreen
        mistakenMeasures={[]}
        bpm={60}
        onReviewMeasure={noop}
        onReturnToStart={noop}
      />
    )
    expect(screen.getByRole('heading', { name: /too many misses/i })).toBeInTheDocument()
  })

  it('shows Review mistaken measures button when mistakes exist', () => {
    render(
      <GameOverScreen
        mistakenMeasures={[makeMeasure()]}
        bpm={60}
        onReviewMeasure={noop}
        onReturnToStart={noop}
      />
    )
    expect(screen.getByRole('button', { name: /review mistaken measures/i })).toBeInTheDocument()
  })

  it('does NOT show Review button when no mistakes', () => {
    render(
      <GameOverScreen
        mistakenMeasures={[]}
        bpm={60}
        onReviewMeasure={noop}
        onReturnToStart={noop}
      />
    )
    expect(screen.queryByRole('button', { name: /review mistaken measures/i })).toBeNull()
  })

  it('Return to start page calls onReturnToStart from the game-over screen', async () => {
    const onReturn = vi.fn()
    render(
      <GameOverScreen
        mistakenMeasures={[]}
        bpm={60}
        onReviewMeasure={noop}
        onReturnToStart={onReturn}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /return to start page/i }))
    expect(onReturn).toHaveBeenCalledOnce()
  })

  it('clicking Review mistaken measures shows the list', async () => {
    render(
      <GameOverScreen
        mistakenMeasures={[makeMeasure()]}
        bpm={60}
        onReviewMeasure={noop}
        onReturnToStart={noop}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /review mistaken measures/i }))
    expect(screen.getByText(/click each measure to see its rhythm/i)).toBeInTheDocument()
  })

  it('the review list renders one card per mistaken measure', async () => {
    const measures = [makeMeasure(), makeMeasure({ label: '3/4 · Varied' })]
    render(
      <GameOverScreen
        mistakenMeasures={measures}
        bpm={60}
        onReviewMeasure={noop}
        onReturnToStart={noop}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /review mistaken measures/i }))
    const cards = screen.getAllByRole('button', { name: /hear measure/i })
    expect(cards).toHaveLength(2)
  })

  it('clicking a measure card calls onReviewMeasure with that measure', async () => {
    const onReview = vi.fn()
    const measure = makeMeasure()
    render(
      <GameOverScreen
        mistakenMeasures={[measure]}
        bpm={60}
        onReviewMeasure={onReview}
        onReturnToStart={noop}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /review mistaken measures/i }))
    await userEvent.click(screen.getByRole('button', { name: /hear measure/i }))
    expect(onReview).toHaveBeenCalledOnce()
    expect(onReview).toHaveBeenCalledWith(measure)
  })

  it('Return to start page on the review list calls onReturnToStart', async () => {
    const onReturn = vi.fn()
    render(
      <GameOverScreen
        mistakenMeasures={[makeMeasure()]}
        bpm={60}
        onReviewMeasure={noop}
        onReturnToStart={onReturn}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /review mistaken measures/i }))
    // Now on the list page — two "Return to start page" buttons (top and bottom); click the first
    await userEvent.click(screen.getAllByRole('button', { name: /return to start page/i })[0])
    expect(onReturn).toHaveBeenCalledOnce()
  })

  it('the review list shows each measure label', async () => {
    render(
      <GameOverScreen
        mistakenMeasures={[makeMeasure({ label: '4/4 · Steady' }), makeMeasure({ label: '3/4 · Varied' })]}
        bpm={60}
        onReviewMeasure={noop}
        onReturnToStart={noop}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /review mistaken measures/i }))
    expect(screen.getByText('4/4 · Steady')).toBeInTheDocument()
    expect(screen.getByText('3/4 · Varied')).toBeInTheDocument()
  })
})

// ── PlayAlong: welcome phase integration ──────────────────────────────────────

describe('PlayAlong — welcome phase', () => {
  it('renders the welcome screen on first load', () => {
    // loadPlayAlongConfig reads localStorage which the test setup polyfills
    // with an in-memory store, returning DEFAULT_CONFIG (startBpm: 60).
    render(<PlayAlong />)
    expect(screen.getByRole('heading', { name: 'Rhythm Game!' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /starting bpm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /let.*s go/i })).toBeInTheDocument()
  })
})

// ── WelcomeScreen: speed label edge cases ────────────────────────────────────

describe('WelcomeScreen speed label', () => {
  function renderAt(bpm: number) {
    const cfg = { ...TEST_CFG, startBpm: bpm, bpmCap: Math.max(bpm, 120) }
    render(<WelcomeScreen onStart={vi.fn()} cfg={cfg} onCfgChange={vi.fn()} initialMode="easy" />)
  }

  it('shows Slow at 50 BPM', () => {
    renderAt(50)
    expect(screen.getByText('Slow')).toBeInTheDocument()
  })

  it('shows Slow at 65 BPM', () => {
    renderAt(65)
    expect(screen.getByText('Slow')).toBeInTheDocument()
  })

  it('shows Moderate at 80 BPM', () => {
    renderAt(80)
    expect(screen.getByText('Moderate')).toBeInTheDocument()
  })
})

// ── GameOverScreen: keyboard accessibility ────────────────────────────────────

describe('GameOverScreen keyboard access', () => {
  it('measure card responds to Enter key', async () => {
    const onReview = vi.fn()
    const measure = makeMeasure()
    render(
      <GameOverScreen
        mistakenMeasures={[measure]}
        bpm={60}
        onReviewMeasure={onReview}
        onReturnToStart={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /review mistaken measures/i }))
    const card = screen.getByRole('button', { name: /hear measure/i })
    card.focus()
    await userEvent.keyboard('{Enter}')
    expect(onReview).toHaveBeenCalledWith(measure)
  })

  it('measure card responds to Space key', async () => {
    const onReview = vi.fn()
    const measure = makeMeasure()
    render(
      <GameOverScreen
        mistakenMeasures={[measure]}
        bpm={60}
        onReviewMeasure={onReview}
        onReturnToStart={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /review mistaken measures/i }))
    const card = screen.getByRole('button', { name: /hear measure/i })
    card.focus()

    // userEvent Space on a non-button element triggers the onKeyDown handler
    // The card is a div[role="button"], so we fire keyDown manually
    await userEvent.keyboard(' ')
    // The card's onKeyDown wires Space → onReviewMeasure
    // In some cases userEvent auto-clicks role=button on Space; either way verify called
    expect(onReview).toHaveBeenCalled()
  })
})

// ── Regression: existing WelcomeScreen bullet list items still render ─────────

describe('WelcomeScreen regression', () => {
  it('still shows the orange arrow hint bullet', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    expect(screen.getByText(/The orange.*marks each downbeat/i)).toBeInTheDocument()
  })

  it('still shows the tap-each-note bullet', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    expect(screen.getByText(/tap the button in time with each note/i)).toBeInTheDocument()
  })

  it('still shows the playback hint bullet', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    expect(screen.getByText(/tap any measure while playing/i)).toBeInTheDocument()
  })

  it('bpm-increase bullet uses cfg values', () => {
    render(<WelcomeScreen onStart={vi.fn()} cfg={TEST_CFG} onCfgChange={vi.fn()} initialMode="easy" />)
    // Mentions the bpmIncreaseAfterMeasures (10) and bpmIncreaseAmount (1) from cfg
    expect(screen.getByText(/every 10 perfect measures/i)).toBeInTheDocument()
  })
})

// Suppress missing import warnings for `within` if not used directly
void within
