// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  PATTERNS, NOTE_MARGIN, NUM_MEASURES, TARGET_FRAMES,
  MIN_BEAT_W, NOTE_MIN_PX,
  calcMeasureW, makeMeasures, buildScrollData,
} from './musicNoteEngine'

// ── Pattern validity ──────────────────────────────────────────────────────────

describe('PATTERNS', () => {
  it('every pattern starts on beat 0', () => {
    for (const pattern of PATTERNS) {
      expect(pattern[0].beat).toBe(0)
    }
  })

  it('every pattern has beats strictly in ascending order', () => {
    for (const pattern of PATTERNS) {
      for (let i = 1; i < pattern.length; i++) {
        expect(pattern[i].beat).toBeGreaterThan(pattern[i - 1].beat)
      }
    }
  })

  it('every beat falls within [0, 4)', () => {
    for (const pattern of PATTERNS) {
      for (const note of pattern) {
        expect(note.beat).toBeGreaterThanOrEqual(0)
        expect(note.beat).toBeLessThan(4)
      }
    }
  })

  it('no pattern has duplicate beats', () => {
    for (const pattern of PATTERNS) {
      const beats = pattern.map(n => n.beat)
      expect(new Set(beats).size).toBe(beats.length)
    }
  })
})

// ── Measure width ─────────────────────────────────────────────────────────────

describe('calcMeasureW', () => {
  it('every pattern produces a width ≥ 4 × MIN_BEAT_W', () => {
    for (const pattern of PATTERNS) {
      for (const isFirst of [true, false]) {
        expect(calcMeasureW(pattern, isFirst)).toBeGreaterThanOrEqual(4 * MIN_BEAT_W)
      }
    }
  })

  it('every pattern has at least MIN_BEAT_W px per quarter beat', () => {
    for (const pattern of PATTERNS) {
      for (const isFirst of [true, false]) {
        const mw = calcMeasureW(pattern, isFirst)
        expect(mw / 4).toBeGreaterThanOrEqual(MIN_BEAT_W)
      }
    }
  })

  it('width accommodates NOTE_MIN_PX for every note type', () => {
    for (const [type, minPx] of Object.entries(NOTE_MIN_PX)) {
      const mw = calcMeasureW([{ beat: 0, type: type as keyof typeof NOTE_MIN_PX }], false)
      expect(mw).toBeGreaterThanOrEqual(minPx)
    }
  })
})

// ── Crossing-time evenness ────────────────────────────────────────────────────
//
// Core invariant: for any two consecutive note crossings (across all measures,
// including barline transitions), the frame interval must equal
//
//   (beat_distance_in_quarter_beats) × (TARGET_FRAMES / 4)
//
// within ±1 frame (integer stepping means one frame of rounding error is
// unavoidable).  A failure here means the barline tempo bug has regressed.

describe('note crossing timing', () => {
  it('every inter-crossing interval matches the musical beat distance (±1 frame)', () => {
    const W  = 375     // realistic mobile canvas width
    const cx = W / 2

    const measures = makeMeasures()
    const { mWidths, cumWidths, mSpeeds, totalContent } = buildScrollData(measures)

    // Mirror the component's applyInitialScroll: start filled, pre-mark past notes
    let scrollX   = W
    let mi_active = 0
    const initCO  = scrollX - cx
    for (let i = 0; i < NUM_MEASURES; i++) {
      const pad = NOTE_MARGIN
      const mw  = mWidths[i]
      for (const note of measures[i]) {
        if (cumWidths[i] + pad + (note.beat / 4) * mw <= initCO) note.triggered = true
      }
    }
    while (mi_active < NUM_MEASURES - 1 && cumWidths[mi_active + 1] + NOTE_MARGIN <= initCO) mi_active++

    // Simulate the frame loop, recording { frame, mi, beat } for each crossing
    type Crossing = { frame: number; mi: number; beat: number }
    const crossings: Crossing[] = []

    const maxFrames = TARGET_FRAMES * NUM_MEASURES * 5
    for (let frame = 0; frame < maxFrames; frame++) {
      scrollX += mSpeeds[mi_active]
      if (scrollX > totalContent + W) break

      const centerOffset = scrollX - cx
      while (mi_active < NUM_MEASURES - 1 && cumWidths[mi_active + 1] + NOTE_MARGIN <= centerOffset) {
        mi_active++
      }

      for (let i = 0; i < NUM_MEASURES; i++) {
        const mw   = mWidths[i]
        const barX = W + cumWidths[i] - scrollX
        if (barX > W + mw || barX + mw < 0) continue
        const pad = NOTE_MARGIN
        for (const note of measures[i]) {
          if (!note.triggered && barX + pad + (note.beat / 4) * mw <= cx) {
            note.triggered = true
            crossings.push({ frame, mi: i, beat: note.beat })
          }
        }
      }
    }

    // Must have captured a substantial number of crossings
    expect(crossings.length).toBeGreaterThan(50)

    // Verify every consecutive pair
    const errors: string[] = []
    for (let i = 1; i < crossings.length; i++) {
      const prev = crossings[i - 1]
      const curr = crossings[i]
      const beatDist     = (curr.mi - prev.mi) * 4 + curr.beat - prev.beat
      const expectedFrames = beatDist * TARGET_FRAMES / 4
      const actualFrames   = curr.frame - prev.frame
      if (Math.abs(actualFrames - expectedFrames) > 1) {
        errors.push(
          `m${prev.mi} beat${prev.beat}→m${curr.mi} beat${curr.beat}: ` +
          `expected ${expectedFrames.toFixed(1)} frames, got ${actualFrames}`
        )
      }
    }
    expect(errors).toEqual([])
  })

  it('crossings are recorded in strictly ascending frame order', () => {
    const W  = 375
    const cx = W / 2
    const measures = makeMeasures()
    const { mWidths, cumWidths, mSpeeds, totalContent } = buildScrollData(measures)

    let scrollX = W
    let mi_active = 0
    const initCO = scrollX - cx
    for (let i = 0; i < NUM_MEASURES; i++) {
      const pad = NOTE_MARGIN
      const mw  = mWidths[i]
      for (const note of measures[i]) {
        if (cumWidths[i] + pad + (note.beat / 4) * mw <= initCO) note.triggered = true
      }
    }
    while (mi_active < NUM_MEASURES - 1 && cumWidths[mi_active + 1] + NOTE_MARGIN <= initCO) mi_active++

    const frames: number[] = []
    for (let frame = 0; frame < TARGET_FRAMES * NUM_MEASURES * 5; frame++) {
      scrollX += mSpeeds[mi_active]
      if (scrollX > totalContent + W) break
      const centerOffset = scrollX - cx
      while (mi_active < NUM_MEASURES - 1 && cumWidths[mi_active + 1] + NOTE_MARGIN <= centerOffset) mi_active++

      for (let i = 0; i < NUM_MEASURES; i++) {
        const mw   = mWidths[i]
        const barX = W + cumWidths[i] - scrollX
        if (barX > W + mw || barX + mw < 0) continue
        const pad = NOTE_MARGIN
        for (const note of measures[i]) {
          if (!note.triggered && barX + pad + (note.beat / 4) * mw <= cx) {
            note.triggered = true
            frames.push(frame)
          }
        }
      }
    }

    for (let i = 1; i < frames.length; i++) {
      expect(frames[i]).toBeGreaterThanOrEqual(frames[i - 1])
    }
  })
})
