// Mirrors backend/app/services/rhythm.py — beat values are in quarter-note beats.
import type { Duration, Pattern, PatternEvent } from '../api/types'

export const DURATION_BEATS: Record<Duration, number> = {
  w: 4,
  h: 2,
  q: 1,
  '8': 0.5,
  '16': 0.25,
  '8t': 1 / 3,
}

export function eventBeats(event: PatternEvent): number {
  let beats = DURATION_BEATS[event.duration]
  if (event.dots) {
    beats *= 1.5
  }
  return beats
}

export function totalBeats(pattern: Pattern): number {
  return pattern.events.reduce((sum, event) => sum + eventBeats(event), 0)
}

export interface Onset {
  eventIndex: number
  beat: number
}

/** Beat positions of every note the student must tap (tied continuations excluded). */
export function expectedOnsets(pattern: Pattern): Onset[] {
  const onsets: Onset[] = []
  let position = 0
  let tiedFromPrevious = false
  for (let i = 0; i < pattern.events.length; i++) {
    const event = pattern.events[i]
    if (event.type === 'note' && !tiedFromPrevious) {
      onsets.push({ eventIndex: i, beat: position })
    }
    position += eventBeats(event)
    tiedFromPrevious = event.type === 'note' && Boolean(event.tieToNext)
  }
  return onsets
}

export function tapCount(pattern: Pattern): number {
  return expectedOnsets(pattern).length
}

/** Convert expected onsets to millisecond offsets at the given tempo. */
export function onsetTimesMs(pattern: Pattern, bpm: number): number[] {
  const msPerBeat = 60000 / bpm
  return expectedOnsets(pattern).map((onset) => onset.beat * msPerBeat)
}

/**
 * Convert a list of tap timestamps into a notated rhythm so students can see what
 * they actually played. Each inter-tap gap is snapped to the nearest representable
 * duration (in beats at the inferred tempo); the final note is rendered as a quarter.
 */
export function tapsToPattern(tapsMs: number[], msPerBeat: number): Pattern {
  if (tapsMs.length === 0) {
    return { events: [] }
  }
  const SNAP_CHOICES: Array<{ beats: number; duration: Duration; dots?: number }> = [
    { beats: 0.25, duration: '16' },
    { beats: 1 / 3, duration: '8t' },
    { beats: 0.375, duration: '16', dots: 1 },
    { beats: 0.5, duration: '8' },
    { beats: 0.75, duration: '8', dots: 1 },
    { beats: 1, duration: 'q' },
    { beats: 1.5, duration: 'q', dots: 1 },
    { beats: 2, duration: 'h' },
    { beats: 3, duration: 'h', dots: 1 },
    { beats: 4, duration: 'w' },
  ]
  const events: PatternEvent[] = []
  for (let i = 0; i < tapsMs.length - 1; i++) {
    const gapBeats = (tapsMs[i + 1] - tapsMs[i]) / msPerBeat
    let best = SNAP_CHOICES[0]
    for (const choice of SNAP_CHOICES) {
      if (Math.abs(choice.beats - gapBeats) < Math.abs(best.beats - gapBeats)) {
        best = choice
      }
    }
    events.push({ type: 'note', duration: best.duration, dots: best.dots ?? 0 })
  }
  events.push({ type: 'note', duration: 'q', dots: 0 })
  return { events }
}

export function describeTimeSignature(top: number, bottom: number): string {
  return `${top}/${bottom}`
}

/**
 * Convert a beat position (0–3.75, within a measure) to the traditional
 * spoken count used when counting rhythm aloud.
 */
export function getBeatLabel(beat: number, tripletGrid = false): string {
  const NAMES = ['one', 'two', 'three', 'four']
  if (tripletGrid) {
    const third = Math.round(beat * 3)
    const whichBeat = Math.floor(third / 3)
    const subdivision = third % 3
    if (subdivision === 0) return NAMES[whichBeat] ?? ''
    if (subdivision === 1) return 'trip'
    return 'let'
  }
  const sixteenth = Math.round(beat * 4)
  const whichBeat = Math.floor(sixteenth / 4)
  const subdivision = sixteenth % 4
  if (subdivision === 0) return NAMES[whichBeat] ?? ''
  if (subdivision === 1) return 'ee'
  if (subdivision === 2) return 'and'
  return 'a'
}

export interface CountingBeat {
  label: string
  hasNote: boolean
  offsetMs: number
}

/**
 * Generate all counting-syllable positions for the playback display.
 * Uses 8th-note grid unless the pattern contains any 16th notes.
 * Each position carries the syllable ("one", "and", "ee", "a"), whether a
 * note falls there, and the ms offset from playback start.
 */
export function buildCountingBeats(
  pattern: Pattern,
  bpm: number,
  timeSigTop: number,
): CountingBeat[] {
  const msPerBeat = 60000 / bpm
  const total = totalBeats(pattern)

  // Determine counting grid from the smallest note duration in the pattern.
  // Also check onset positions for dotted notes (e.g. dotted quarter creates
  // a half-beat onset even though no '8' duration event exists).
  const has16th = pattern.events.some(e => e.duration === '16')
  const has8th  = pattern.events.some(e => e.duration === '8')
  const has8t   = pattern.events.some(e => e.duration === '8t')

  const onsets = expectedOnsets(pattern)
  const onsetBeats = onsets.map(o => o.beat)
  // Dotted-note detection via onset positions (e.g. dotted quarter → onset at x.5)
  const dottedNeeds16th = onsetBeats.some(
    b => Math.abs(b * 4 - Math.round(b * 4)) < 0.001 &&
         Math.abs(b * 2 - Math.round(b * 2)) > 0.01
  )
  const dottedNeeds8th = onsetBeats.some(
    b => Math.abs(b * 2 - Math.round(b * 2)) < 0.001 &&
         Math.abs(b - Math.round(b)) > 0.01
  )
  // Collect positions keyed by pos * 12000 (covers 1/3, 1/4, 1/2, 2/3, 3/4 exactly)
  const byKey = new Map<number, { pos: number; label: string }>()
  const add = (pos: number, label: string) => {
    const key = Math.round(pos * 12000)
    if (label && !byKey.has(key)) byKey.set(key, { pos, label })
  }

  if (has8t) {
    // Which integer beats contain a triplet group (has a note at +1/3 or +2/3)
    const tripletBeatFloors = new Set<number>()
    for (const b of onsetBeats) {
      const floorVal = Math.floor(b + 1e-9)
      const sub = b - floorVal
      if (Math.abs(sub - 1 / 3) < 0.01 || Math.abs(sub - 2 / 3) < 0.01) {
        tripletBeatFloors.add(floorVal)
      }
    }

    // Integer beats (always)
    for (let b = 0; b < total - 0.001; b++) {
      add(b, getBeatLabel(b % timeSigTop))
    }

    // Triplet sub-positions only where actual triplet notes land
    for (const b of onsetBeats) {
      const floorVal = Math.floor(b + 1e-9)
      const sub = b - floorVal
      if (Math.abs(sub - 1 / 3) < 0.01)      add(b, 'trip')
      else if (Math.abs(sub - 2 / 3) < 0.01) add(b, 'let')
    }

    // Regular subdivisions ("and", "ee", "a") for beats that don't have triplets.
    // Beats that DO have triplets skip this so "and" never appears inside a triplet group.
    const regularGrid = (has16th || dottedNeeds16th) ? 0.25
                      : (has8th  || dottedNeeds8th)  ? 0.5
                      : 1.0
    if (regularGrid < 1.0) {
      let pos = 0
      while (pos < total - 0.001) {
        const floorVal = Math.floor(pos + 1e-9)
        const sub = pos - floorVal
        if (Math.abs(sub) > 0.001 && !tripletBeatFloors.has(floorVal)) {
          add(pos, getBeatLabel(pos % timeSigTop))
        }
        pos = Math.round((pos + regularGrid) * 12000) / 12000
      }
    }
  } else {
    // Non-triplet patterns: use a uniform subdivision grid (original logic).
    const grid = (has16th || dottedNeeds16th) ? 0.25
               : (has8th  || dottedNeeds8th)  ? 0.5
               : 1.0
    let pos = 0
    while (pos < total - 0.001) {
      add(pos, getBeatLabel(pos % timeSigTop))
      pos = Math.round((pos + grid) * 12000) / 12000
    }
  }

  const noteSet = new Set(onsetBeats.map(b => Math.round(b * 12000)))

  return [...byKey.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([key, { pos, label }]) => ({
      label,
      hasNote: noteSet.has(key),
      offsetMs: pos * msPerBeat,
    }))
}
