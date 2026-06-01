// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  SLOT_PX,
  CURSOR_FRAC,
  DEFAULT_DOWNBEAT_INSET_PX,
  msPerMeasure,
  msPerBeat,
  reelTranslateX,
  measureAtCursor,
  totalMeasuresPassed,
  onsetDueMs,
  shouldShowDownbeat,
  cursorLineX,
  resumedStartTime,
} from './playAlongTiming'

// ── Tempo ──────────────────────────────────────────────────────────────────────

describe('msPerMeasure', () => {
  it('returns 6000 ms at 40 BPM', () => {
    expect(msPerMeasure(40)).toBe(6000)
  })
  it('returns 3000 ms at 80 BPM', () => {
    expect(msPerMeasure(80)).toBe(3000)
  })
  it('returns 4000 ms at 60 BPM', () => {
    expect(msPerMeasure(60)).toBeCloseTo(4000)
  })
  it('scales inversely with BPM', () => {
    expect(msPerMeasure(40) / msPerMeasure(80)).toBeCloseTo(2)
  })
})

describe('msPerBeat', () => {
  it('returns 1500 ms/beat at 40 BPM', () => {
    expect(msPerBeat(40)).toBe(1500)
  })
  it('is msPerMeasure / 4', () => {
    expect(msPerBeat(60)).toBeCloseTo(msPerMeasure(60) / 4)
  })
})

// ── Reel translate ─────────────────────────────────────────────────────────────

describe('reelTranslateX', () => {
  const BPM = 40
  const VP = 800
  const mspM = msPerMeasure(BPM)          // 6000 ms
  const loopMs = 24 * mspM                 // 24 unique measures

  it('starts with left edge at cursor (vpWidth * CURSOR_FRAC) when elapsed=0', () => {
    const x = reelTranslateX(0, VP, mspM, loopMs)
    expect(x).toBe(VP * CURSOR_FRAC)       // 200 px
  })

  it('returns startOffset for negative elapsed (static phase)', () => {
    expect(reelTranslateX(-1000, VP, mspM, loopMs)).toBe(VP * CURSOR_FRAC)
  })

  it('moves left by exactly SLOT_PX after one measure elapses', () => {
    const x0 = reelTranslateX(0, VP, mspM, loopMs)
    const x1 = reelTranslateX(mspM, VP, mspM, loopMs)
    expect(x0 - x1).toBeCloseTo(SLOT_PX)
  })

  it('moves at a constant speed of SLOT_PX per msPerMeasure', () => {
    // Compare two time points in the middle of the reel
    const t1 = 2500
    const t2 = 5000
    const x1 = reelTranslateX(t1, VP, mspM, loopMs)
    const x2 = reelTranslateX(t2, VP, mspM, loopMs)
    const observedPxPerMs = (x1 - x2) / (t2 - t1)      // positive = moving left
    const expectedPxPerMs = SLOT_PX / mspM
    expect(observedPxPerMs).toBeCloseTo(expectedPxPerMs, 5)
  })

  it('loops back to the start position after one full loop', () => {
    const x0 = reelTranslateX(0, VP, mspM, loopMs)
    const xLoop = reelTranslateX(loopMs, VP, mspM, loopMs)
    expect(xLoop).toBeCloseTo(x0)
  })

  it('is consistent at BPM 80', () => {
    const fast = msPerMeasure(80)
    const x = reelTranslateX(fast, VP, fast, 24 * fast)
    expect(reelTranslateX(0, VP, fast, 24 * fast) - x).toBeCloseTo(SLOT_PX)
  })
})

// ── Measure index ─────────────────────────────────────────────────────────────

describe('measureAtCursor', () => {
  const BPM = 40
  const mspM = msPerMeasure(BPM)
  const REEL = 24

  it('returns 0 before play starts (elapsed ≤ 0)', () => {
    expect(measureAtCursor(0, mspM, REEL)).toBe(0)
    expect(measureAtCursor(-1, mspM, REEL)).toBe(0)
  })

  it('returns 0 at the very start of play', () => {
    expect(measureAtCursor(1, mspM, REEL)).toBe(0)
  })

  it('advances to measure 1 after one measure', () => {
    expect(measureAtCursor(mspM, mspM, REEL)).toBe(1)
  })

  it('wraps at REEL_UNIQUE boundary', () => {
    expect(measureAtCursor(REEL * mspM, mspM, REEL)).toBe(0)
  })

  it('wraps mid-loop correctly', () => {
    expect(measureAtCursor((REEL + 3) * mspM, mspM, REEL)).toBe(3)
  })
})

describe('totalMeasuresPassed', () => {
  const mspM = msPerMeasure(40)

  it('returns 0 before play', () => {
    expect(totalMeasuresPassed(0, mspM)).toBe(0)
    expect(totalMeasuresPassed(-100, mspM)).toBe(0)
  })

  it('counts measures linearly', () => {
    expect(totalMeasuresPassed(mspM * 5, mspM)).toBe(5)
    expect(totalMeasuresPassed(mspM * 11, mspM)).toBe(11)
  })
})

// ── Onset timing ──────────────────────────────────────────────────────────────

describe('onsetDueMs', () => {
  const BPM = 40
  const mspM = msPerMeasure(BPM)

  it('downbeat of measure 0 is due at elapsed 0', () => {
    expect(onsetDueMs(0, 0, mspM, BPM)).toBe(0)
  })

  it('beat 1 (quarter 1) of measure 0 is due at msPerBeat', () => {
    expect(onsetDueMs(0, 1, mspM, BPM)).toBeCloseTo(msPerBeat(BPM))
  })

  it('downbeat of measure 1 is due at mspM', () => {
    expect(onsetDueMs(1, 0, mspM, BPM)).toBeCloseTo(mspM)
  })

  it('scales correctly with BPM', () => {
    const due40 = onsetDueMs(2, 1, msPerMeasure(40), 40)
    const due80 = onsetDueMs(2, 1, msPerMeasure(80), 80)
    expect(due40 / due80).toBeCloseTo(2)
  })
})

// ── Cursor line geometry ────────────────────────────────────────────────────

describe('cursorLineX', () => {
  const VP = 800

  it('sits at the barline crossing plus the downbeat inset', () => {
    expect(cursorLineX(VP, 28)).toBe(VP * CURSOR_FRAC + 28)
  })

  it('uses the default inset when none is given', () => {
    expect(cursorLineX(VP)).toBe(VP * CURSOR_FRAC + DEFAULT_DOWNBEAT_INSET_PX)
  })

  it('aligns with the downbeat note head at the due moment', () => {
    // At elapsed = onsetDueMs(absIdx, 0), the measure's left edge (reel translateX
    // for the first measure) is at vpWidth*CURSOR_FRAC. The note head is drawn
    // `inset` px to the right, so the cursor line must equal that screen-x.
    const inset = 31
    const barlineScreenX = reelTranslateX(0, VP, msPerMeasure(60), 24 * msPerMeasure(60))
    expect(cursorLineX(VP, inset)).toBeCloseTo(barlineScreenX + inset)
  })

  it('scales the 25% fraction with viewport width', () => {
    expect(cursorLineX(1200, 0)).toBe(300)
    expect(cursorLineX(400, 0)).toBe(100)
  })
})

// ── Pause / resume ────────────────────────────────────────────────────────────

describe('resumedStartTime', () => {
  it('keeps elapsed continuous across a pause', () => {
    const startTime = 1000
    const pauseStart = 3500          // elapsed at pause = 2500
    const resumeNow = 9000           // paused for 5500 ms
    const newStart = resumedStartTime(startTime, pauseStart, resumeNow)
    // elapsed immediately after resume must equal elapsed at pause
    expect(resumeNow - newStart).toBeCloseTo(pauseStart - startTime)
  })

  it('shifts startTime forward by exactly the pause duration', () => {
    expect(resumedStartTime(0, 200, 1200)).toBe(1000) // paused 1000 ms
  })

  it('is a no-op for a zero-length pause', () => {
    expect(resumedStartTime(500, 800, 800)).toBe(500)
  })

  it('accumulates correctly across two pauses', () => {
    let start = 0
    // first pause: elapsed 1000 at t=1000, resume at t=1600 (paused 600)
    start = resumedStartTime(start, 1000, 1600)
    expect(1600 - start).toBeCloseTo(1000)
    // second pause: elapsed now 2000 at t=2600, resume at t=3000 (paused 400)
    start = resumedStartTime(start, 2600, 3000)
    expect(3000 - start).toBeCloseTo(2000)
  })
})

// ── Arrow / beat indicator ────────────────────────────────────────────────────

describe('shouldShowDownbeat', () => {
  it('returns true in static phase regardless of beat', () => {
    expect(shouldShowDownbeat('static', null)).toBe(true)
    expect(shouldShowDownbeat('static', 0)).toBe(true)
    expect(shouldShowDownbeat('static', 2)).toBe(true)
  })

  it('returns true in playing phase only on beat 0', () => {
    expect(shouldShowDownbeat('playing', 0)).toBe(true)
  })

  it('returns false in playing phase on beats 1-3', () => {
    expect(shouldShowDownbeat('playing', 1)).toBe(false)
    expect(shouldShowDownbeat('playing', 2)).toBe(false)
    expect(shouldShowDownbeat('playing', 3)).toBe(false)
  })

  it('returns false in playing phase when beat is null', () => {
    expect(shouldShowDownbeat('playing', null)).toBe(false)
  })
})
