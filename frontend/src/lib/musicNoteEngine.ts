// Pure timing and layout logic for the home-page music note animation.
// Extracted here so it can be unit-tested independently of the React component.

export const SPEED        = 0.55   // px per frame, right → left
export const NUM_MEASURES = 80     // pool size (resets when exhausted)
export const NOTE_MARGIN  = 16     // px: barline → first note (non-first measures)
export const FIRST_MARGIN = 52     // px: barline → first note on measure 0

// Frames for one full measure to scroll past the centre line.
// All measures share this value so the BPM is constant regardless of measure width.
export const TARGET_FRAMES = Math.round(216 / SPEED)

export type NoteType = 'w' | 'h' | 'q' | 'e' | 's' | 'dq'

export interface RhythmNote { beat: number; type: NoteType }

export interface MeasureNote extends RhythmNote {
  yPos: number
  triggered: boolean
}

export const PATTERNS: RhythmNote[][] = [
  [{ beat:0, type:'q' },{ beat:1, type:'q' },{ beat:2, type:'q' },{ beat:3, type:'q' }],
  [{ beat:0, type:'h' },{ beat:2, type:'q' },{ beat:3, type:'q' }],
  [{ beat:0, type:'e' },{ beat:.5, type:'e' },{ beat:1, type:'e' },{ beat:1.5, type:'e' },{ beat:2, type:'h' }],
  [{ beat:0, type:'dq' },{ beat:1.5, type:'e' },{ beat:2, type:'q' },{ beat:3, type:'q' }],
  [{ beat:0, type:'e' },{ beat:.5, type:'e' },{ beat:1, type:'e' },{ beat:1.5, type:'e' },
   { beat:2, type:'e' },{ beat:2.5, type:'e' },{ beat:3, type:'e' },{ beat:3.5, type:'e' }],
  [{ beat:0, type:'h' },{ beat:2, type:'e' },{ beat:2.5, type:'e' },{ beat:3, type:'e' },{ beat:3.5, type:'e' }],
  [{ beat:0, type:'e' },{ beat:.5, type:'dq' },{ beat:2, type:'e' },{ beat:2.5, type:'dq' }],
  [{ beat:0, type:'q' },{ beat:1, type:'e' },{ beat:1.5, type:'e' },{ beat:2, type:'q' },{ beat:3, type:'e' },{ beat:3.5, type:'e' }],
  [{ beat:0, type:'w' }],
  [{ beat:0, type:'q' },{ beat:1, type:'q' },{ beat:2, type:'h' }],
  [{ beat:0, type:'dq' },{ beat:1.5, type:'e' },{ beat:2, type:'dq' },{ beat:3.5, type:'e' }],
  [{ beat:0, type:'e' },{ beat:.5, type:'e' },{ beat:1, type:'q' },{ beat:2, type:'e' },{ beat:2.5, type:'e' },{ beat:3, type:'q' }],
  // 16th-note patterns
  [{ beat:0, type:'s' },{ beat:.25, type:'s' },{ beat:.5, type:'s' },{ beat:.75, type:'s' },
   { beat:1, type:'s' },{ beat:1.25, type:'s' },{ beat:1.5, type:'s' },{ beat:1.75, type:'s' },
   { beat:2, type:'s' },{ beat:2.25, type:'s' },{ beat:2.5, type:'s' },{ beat:2.75, type:'s' },
   { beat:3, type:'s' },{ beat:3.25, type:'s' },{ beat:3.5, type:'s' },{ beat:3.75, type:'s' }],
  [{ beat:0, type:'s' },{ beat:.25, type:'s' },{ beat:.5, type:'s' },{ beat:.75, type:'s' },
   { beat:1, type:'q' },{ beat:2, type:'q' },{ beat:3, type:'q' }],
  [{ beat:0, type:'q' },{ beat:1, type:'s' },{ beat:1.25, type:'s' },{ beat:1.5, type:'s' },{ beat:1.75, type:'s' },
   { beat:2, type:'q' },{ beat:3, type:'q' }],
  [{ beat:0, type:'h' },
   { beat:2, type:'s' },{ beat:2.25, type:'s' },{ beat:2.5, type:'s' },{ beat:2.75, type:'s' },
   { beat:3, type:'s' },{ beat:3.25, type:'s' },{ beat:3.5, type:'s' },{ beat:3.75, type:'s' }],
]

export const STAFF_POS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

export const NOTE_MIN_PX: Record<NoteType, number> = {
  w: 80, h: 60, q: 50, dq: 58, e: 34, s: 26,
}
export const MIN_BEAT_W = 50   // minimum px per quarter beat → 200 px floor

/**
 * Minimum measure width that keeps all notes un-cramped and guarantees
 * at least NOTE_MARGIN breathing room after the last note onset.
 */
export function calcMeasureW(
  notes: Array<{ type: NoteType; beat: number }>,
  isFirst: boolean,
): number {
  const nm       = isFirst ? FIRST_MARGIN : NOTE_MARGIN
  const content  = notes.reduce((s, n) => s + NOTE_MIN_PX[n.type], 0)
  const lastBeat = Math.max(...notes.map(n => n.beat))
  const minRight = lastBeat < 4
    ? Math.ceil((nm + NOTE_MARGIN) / (1 - lastBeat / 4))
    : nm + content + NOTE_MARGIN
  return Math.max(4 * MIN_BEAT_W, nm + content + NOTE_MARGIN, minRight)
}

/** Build the full pool of measures, cycling through PATTERNS. */
export function makeMeasures(): MeasureNote[][] {
  return Array.from({ length: NUM_MEASURES }, (_, mi) => {
    const pattern = PATTERNS[mi % PATTERNS.length]
    return pattern.map((note) => ({
      ...note,
      yPos: STAFF_POS[Math.floor(Math.random() * STAFF_POS.length)],
      triggered: false,
    }))
  })
}

/**
 * Build the derived scroll-speed data for a set of measures.
 * Returns { mWidths, cumWidths, mSpeeds, totalContent }.
 */
export function buildScrollData(measures: MeasureNote[][]) {
  const mWidths: number[]  = measures.map((m, mi) => calcMeasureW(m, mi === 0))
  const cumWidths: number[] = [0]
  for (let i = 0; i < NUM_MEASURES; i++) cumWidths.push(cumWidths[i] + mWidths[i])
  const totalContent = cumWidths[NUM_MEASURES]
  const mSpeeds      = mWidths.map(mw => mw / TARGET_FRAMES)
  return { mWidths, cumWidths, mSpeeds, totalContent }
}
