// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { generateReel, ensureNoLeadingRest, ensureNoTrailingRest } from './rhythmGenerator'
import { DURATION_BEATS } from './rhythm'

// ── ensureNoLeadingRest ────────────────────────────────────────────────────────

describe('ensureNoLeadingRest', () => {
  it('returns empty array unchanged', () => {
    expect(ensureNoLeadingRest([])).toEqual([])
  })

  it('leaves a measure that starts with a note unchanged', () => {
    const events = [
      { type: 'note' as const, duration: 'q' as const },
      { type: 'rest' as const, duration: 'q' as const },
    ]
    const result = ensureNoLeadingRest(events)
    expect(result[0].type).toBe('note')
    expect(result[1].type).toBe('rest')   // later rest untouched
  })

  it('replaces a leading quarter rest with a quarter note', () => {
    const events = [
      { type: 'rest' as const, duration: 'q' as const },
      { type: 'note' as const, duration: 'q' as const },
    ]
    const result = ensureNoLeadingRest(events)
    expect(result[0]).toEqual({ type: 'note', duration: 'q' })
    expect(result[1].type).toBe('note')   // original second event unchanged
  })

  it('replaces a leading eighth rest with an eighth note', () => {
    const events = [{ type: 'rest' as const, duration: '8' as const }]
    const result = ensureNoLeadingRest(events)
    expect(result[0]).toEqual({ type: 'note', duration: '8' })
  })

  it('preserves dots on the replaced note', () => {
    const events = [{ type: 'rest' as const, duration: 'q' as const, dots: 1 }]
    const result = ensureNoLeadingRest(events)
    expect(result[0]).toEqual({ type: 'note', duration: 'q', dots: 1 })
  })

  it('does not mutate the original array', () => {
    const events = [{ type: 'rest' as const, duration: 'q' as const }]
    ensureNoLeadingRest(events)
    expect(events[0].type).toBe('rest')
  })

  it('only replaces the first event, not later rests', () => {
    const events = [
      { type: 'rest' as const, duration: 'q' as const },
      { type: 'note' as const, duration: 'q' as const },
      { type: 'rest' as const, duration: 'q' as const },
    ]
    const result = ensureNoLeadingRest(events)
    expect(result[0].type).toBe('note')   // replaced
    expect(result[1].type).toBe('note')   // untouched
    expect(result[2].type).toBe('rest')   // untouched
  })
})

// ── ensureNoTrailingRest ───────────────────────────────────────────────────────

describe('ensureNoTrailingRest', () => {
  it('returns empty array unchanged', () => {
    expect(ensureNoTrailingRest([])).toEqual([])
  })

  it('leaves a measure that ends with a note unchanged', () => {
    const events = [
      { type: 'note' as const, duration: 'q' as const },
      { type: 'note' as const, duration: 'q' as const },
    ]
    const result = ensureNoTrailingRest(events)
    expect(result).toEqual(events)
    expect(result[result.length - 1].type).toBe('note')
  })

  it('replaces a trailing quarter rest with a quarter note', () => {
    const events = [
      { type: 'note' as const, duration: 'q' as const },
      { type: 'rest' as const, duration: 'q' as const },
    ]
    const result = ensureNoTrailingRest(events)
    expect(result).toHaveLength(2)
    expect(result[result.length - 1]).toEqual({ type: 'note', duration: 'q' })
  })

  it('replaces a trailing half rest with a half note', () => {
    const events = [{ type: 'rest' as const, duration: 'h' as const }]
    const result = ensureNoTrailingRest(events)
    expect(result[0]).toEqual({ type: 'note', duration: 'h' })
  })

  it('preserves dots on the replaced note', () => {
    const events = [{ type: 'rest' as const, duration: 'q' as const, dots: 1 }]
    const result = ensureNoTrailingRest(events)
    expect(result[0]).toEqual({ type: 'note', duration: 'q', dots: 1 })
  })

  it('does not mutate the original array', () => {
    const events = [{ type: 'rest' as const, duration: 'q' as const }]
    ensureNoTrailingRest(events)
    expect(events[0].type).toBe('rest')
  })

  it('only replaces the last event, not earlier rests', () => {
    const events = [
      { type: 'rest' as const, duration: 'q' as const },
      { type: 'note' as const, duration: 'q' as const },
      { type: 'rest' as const, duration: 'q' as const },
    ]
    const result = ensureNoTrailingRest(events)
    expect(result[0].type).toBe('rest')   // untouched
    expect(result[1].type).toBe('note')   // untouched
    expect(result[2].type).toBe('note')   // replaced
  })
})

// ── generateReel first-measure constraint ──────────────────────────────────────

describe('generateReel — first measure', () => {
  it('never starts with a rest (default seed)', () => {
    const reel = generateReel(24)
    expect(reel[0].events[0]?.type).toBe('note')
  })

  it('never ends with a rest (default seed)', () => {
    const reel = generateReel(24)
    expect(reel[0].events.at(-1)?.type).toBe('note')
  })

  it('never starts with a rest across a range of seeds', () => {
    for (let seed = 0; seed < 50; seed++) {
      const reel = generateReel(24, seed)
      expect(reel[0].events[0]?.type, `seed ${seed}`).toBe('note')
    }
  })

  it('never ends with a rest across a range of seeds', () => {
    for (let seed = 0; seed < 50; seed++) {
      const reel = generateReel(24, seed)
      const last = reel[0].events.at(-1)
      expect(last?.type, `seed ${seed}`).toBe('note')
    }
  })

  it('still produces a measure with the correct beat count', () => {
    const DURATION_BEATS: Record<string, number> = {
      w: 4, h: 2, q: 1, '8': 0.5, '16': 0.25,
    }
    for (let seed = 0; seed < 20; seed++) {
      const reel = generateReel(24, seed)
      const events = reel[0].events
      const total = events.reduce((sum, e) => {
        const base = DURATION_BEATS[e.duration] ?? 1
        return sum + base + (e.dots ? base * 0.5 : 0)
      }, 0)
      // First measure is always 4/4 at level 1-2
      expect(total, `seed ${seed}`).toBeCloseTo(4)
    }
  })
})

// ── generateReel difficulty ramp ──────────────────────────────────────────────

describe('generateReel — difficulty ramp', () => {
  const EIGHTH_DURATIONS = new Set(['8', '16'])

  function hasEighths(events: { duration: string }[]) {
    return events.some(e => EIGHTH_DURATIONS.has(e.duration))
  }

  it('measures 0-1 contain no eighth or sixteenth notes (level 1)', () => {
    for (let seed = 0; seed < 20; seed++) {
      const reel = generateReel(24, seed)
      for (let i = 0; i <= 1; i++) {
        expect(hasEighths(reel[i].events), `seed ${seed}, measure ${i}`).toBe(false)
      }
    }
  })

  it('measure 2+ can contain eighth notes (level 2 unlocked)', () => {
    // Over many seeds at least some measure-2s will have eighths
    const reels = Array.from({ length: 30 }, (_, s) => generateReel(24, s))
    const anyHasEighths = reels.some(r => hasEighths(r[2].events))
    expect(anyHasEighths).toBe(true)
  })

  it('measure 5+ can contain dotted figures (level 3 unlocked)', () => {
    const reels = Array.from({ length: 30 }, (_, s) => generateReel(24, s))
    const anyHasDotted = reels.some(r => r[5].events.some(e => e.dots))
    expect(anyHasDotted).toBe(true)
  })
})

// ── generateReel general ───────────────────────────────────────────────────────

describe('generateReel general', () => {
  it('returns exactly count measures', () => {
    expect(generateReel(24)).toHaveLength(24)
    expect(generateReel(8)).toHaveLength(8)
  })

  it('is deterministic — same seed = same output', () => {
    const a = generateReel(24, 42)
    const b = generateReel(24, 42)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('different seeds produce different first measures', () => {
    const a = generateReel(24, 1)
    const b = generateReel(24, 999)
    // They might collide in rare cases, but across any two very different seeds they won't
    expect(JSON.stringify(a[0].events)).not.toBe(JSON.stringify(b[0].events))
  })
})

// ── Game invariants (guard against regressions) ─────────────────────────────────

describe('generateReel — game invariants', () => {
  function measureBeats(events: { duration: 'w'|'h'|'q'|'8'|'16'; dots?: number }[]): number {
    return events.reduce((sum, e) => {
      const base = DURATION_BEATS[e.duration]
      return sum + base + (e.dots ? base * 0.5 : 0)
    }, 0)
  }

  it('every measure fills its bar exactly, across many seeds', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const m of generateReel(24, seed)) {
        const expected = m.timeSigTop * (4 / m.timeSigBottom)
        expect(measureBeats(m.events)).toBeCloseTo(expected, 5)
      }
    }
  })

  it('whole notes (single-note measures) only appear at level 4+', () => {
    // Whole notes are a welcome breather at higher tempos; they must not appear
    // in the easy early measures.
    for (let seed = 1; seed <= 40; seed++) {
      for (const m of generateReel(24, seed)) {
        if (m.events.some(e => e.duration === 'w')) {
          expect(m.level).toBeGreaterThanOrEqual(4)
        }
      }
    }
  })

  it('first measure always starts and ends on a note, across seeds', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const first = generateReel(24, seed)[0]
      expect(first.events[0].type).toBe('note')
      expect(first.events[first.events.length - 1].type).toBe('note')
    }
  })

  it('never produces an empty measure', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const m of generateReel(24, seed)) {
        expect(m.events.length).toBeGreaterThan(0)
      }
    }
  })
})
