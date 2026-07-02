/**
 * Procedural rhythm pattern generator.
 *
 * Uses a deterministic seeded PRNG (Mulberry32) so the same seed always
 * produces the same pattern — stable React keys, no layout thrash.
 *
 * Architecture: "fills by beat count".
 *   - ONE_BEAT  fills: options that consume exactly 1 quarter-note beat
 *   - TWO_BEAT  fills: options that consume exactly 2 quarter-note beats
 *   - FOUR_BEAT fills: options that consume exactly 4 quarter-note beats
 *
 * fillMeasure() picks from whichever fills fit within the remaining beats,
 * so `remaining` is always a positive integer and the loop always terminates.
 *
 * Difficulty levels 1–5 progressively unlock more subdivision choices:
 *   1 → quarters, halves, whole notes
 *   2 → eighth-note pairs, half rests
 *   3 → dotted-quarter + eighth pairs (2-beat), quarter rests
 *   4 → syncopation: rest → note pairs, rest-eighth starts
 *   5 → sixteenth groups, gallop/reverse-gallop figures
 */

import type { PatternEvent } from "../api/types";
import { eventBeats } from "./rhythm";

// ── Seeded PRNG (Mulberry32) ──────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Note/rest constructors ────────────────────────────────────────────────────

function n(
  duration: PatternEvent["duration"],
  dots = 0,
  tieToNext = false,
): PatternEvent {
  const e: PatternEvent = { type: "note", duration };
  if (dots) e.dots = dots;
  if (tieToNext) e.tieToNext = true;
  return e;
}

function r(duration: PatternEvent["duration"], dots = 0): PatternEvent {
  const e: PatternEvent = { type: "rest", duration };
  if (dots) e.dots = dots;
  return e;
}

// ── Fill menus ────────────────────────────────────────────────────────────────
//
// Each array element is a PatternEvent[] that fills exactly the named duration.
// All arithmetic verified: no fractional-quarter remainders possible.

type Fill = PatternEvent[];

/** Fills consuming exactly 1 quarter-note beat. */
const ONE_BEAT: { minLevel: number; fill: Fill }[] = [
  { minLevel: 1, fill: [n("q")] },
  { minLevel: 1, fill: [n("q")] }, // duplicate → higher weight
  { minLevel: 1, fill: [r("q")] },
  { minLevel: 2, fill: [n("8"), n("8")] },
  { minLevel: 3, fill: [n("8t"), n("8t"), n("8t")] }, // eighth-note triplet (3 × ⅓ = 1 beat)
  { minLevel: 2, fill: [n("8"), r("8")] },
  { minLevel: 2, fill: [r("8"), n("8")] },
  { minLevel: 4, fill: [r("8"), n("8")] }, // extra weight on syncopated start
  { minLevel: 5, fill: [n("16"), n("16"), n("16"), n("16")] },
  { minLevel: 5, fill: [n("8", 1), n("16")] }, // gallop (dotted-8th + 16th)
  { minLevel: 5, fill: [n("16"), n("8", 1)] }, // reverse gallop
  { minLevel: 5, fill: [r("8"), n("16"), n("16")] }, // offbeat sixteenths (0.5+0.25+0.25)
  { minLevel: 5, fill: [r("16"), n("16"), n("8")] }, // late-start (0.25+0.25+0.5)
];

/** Fills consuming exactly 2 quarter-note beats. */
const TWO_BEAT: { minLevel: number; fill: Fill }[] = [
  { minLevel: 1, fill: [n("h")] },
  { minLevel: 2, fill: [r("h")] },
  // dotted-quarter + eighth  (1.5 + 0.5 = 2)
  { minLevel: 3, fill: [n("q", 1), n("8")] },
  { minLevel: 3, fill: [n("q", 1), r("8")] },
  // eighth + dotted-quarter  (0.5 + 1.5 = 2)
  { minLevel: 3, fill: [n("8"), n("q", 1)] },
  // syncopated 2-beat figures
  { minLevel: 4, fill: [r("8"), n("q", 0, true), n("8")] }, // rest-note-tie-note
  { minLevel: 4, fill: [n("8"), r("q"), n("8")] }, // note-rest-note
  { minLevel: 4, fill: [r("q"), n("q")] }, // rest then note
];

/** Fills consuming exactly 4 quarter-note beats (4/4 only). */
const FOUR_BEAT: { minLevel: number; fill: Fill }[] = [
  { minLevel: 4, fill: [n("w")] }, // whole note: level 4+ only (~70 BPM, welcomed as a breather)
  { minLevel: 4, fill: [r("w")] }, // whole rest: level 4+ only
];

// ── Fill a measure ────────────────────────────────────────────────────────────

function fillMeasure(
  beats: number,
  level: number,
  rng: () => number,
  allowTriplets = true,
): PatternEvent[] {
  const events: PatternEvent[] = [];
  let remaining = beats;

  while (remaining > 0) {
    // Collect eligible fills
    const eligible: Fill[] = [];

    if (remaining >= 4) {
      for (const { minLevel, fill } of FOUR_BEAT) {
        if (level >= minLevel) eligible.push(fill);
      }
    }
    if (remaining >= 2) {
      for (const { minLevel, fill } of TWO_BEAT) {
        if (level >= minLevel) eligible.push(fill);
      }
    }
    // Always include 1-beat fills as long as ≥1 beat remains
    for (const { minLevel, fill } of ONE_BEAT) {
      if (level >= minLevel) {
        if (allowTriplets || !fill.some((e) => e.duration === "8t"))
          eligible.push(fill);
      }
    }

    // Should never be empty (at least [n('q')] is always available)
    if (eligible.length === 0) break;

    const fill = eligible[Math.floor(rng() * eligible.length)];
    events.push(...fill.map((e) => ({ ...e }))); // shallow-copy each event for safety
    remaining -= fillBeats(fill);
    // Round to 1/12-beat precision to prevent floating-point drift from 1/3-beat triplets.
    remaining = Math.round(remaining * 12) / 12;
  }

  return events;
}

function fillBeats(fill: Fill): number {
  return fill.reduce((sum, e) => sum + eventBeats(e), 0);
}

// ── Post-processing ───────────────────────────────────────────────────────────

/**
 * Replace the first event with a note if it is a rest.
 * Used so the first measure of the Play Along game never starts on silence —
 * the player needs a clear note to tap as their entry point.
 * Preserves duration and dots.
 */
export function ensureNoLeadingRest(events: PatternEvent[]): PatternEvent[] {
  if (events.length === 0) return events;
  const first = events[0];
  if (first.type !== "rest") return events;
  const fixed: PatternEvent = { type: "note", duration: first.duration };
  if (first.dots) fixed.dots = first.dots;
  return [fixed, ...events.slice(1)];
}

/**
 * Replace the last event with a note if it is a rest.
 * Used so the first measure of the Play Along game never ends on silence.
 * Preserves duration and dots; strips ties (a trailing tie makes no sense).
 */
export function ensureNoTrailingRest(events: PatternEvent[]): PatternEvent[] {
  if (events.length === 0) return events;
  const last = events[events.length - 1];
  if (last.type !== "rest") return events;
  const fixed: PatternEvent = { type: "note", duration: last.duration };
  if (last.dots) fixed.dots = last.dots;
  return [...events.slice(0, -1), fixed];
}

// ── Note-count floor ───────────────────────────────────────────────────────────

/** Count tappable notes (rests don't count). */
export function countNotes(events: PatternEvent[]): number {
  return events.filter((e) => e.type === "note").length;
}

/**
 * Minimum number of NOTES a measure must contain.
 * Early/slower measures (levels 1–3) must feel substantial — no sparse 1–2 note
 * bars. Breathers (whole notes, sparse syncopation) are only allowed once the
 * game has sped up, i.e. levels 4–5.
 */
export function minNotesForLevel(level: number): number {
  return level <= 3 ? 3 : 1;
}

// ── Safe wrapper ──────────────────────────────────────────────────────────────

function fillsBar(events: PatternEvent[], beats: number): boolean {
  const total = events.reduce((sum, event) => sum + eventBeats(event), 0);
  return Math.abs(total - beats) < 0.01;
}

function safeGenerate(
  beats: number,
  level: number,
  rng: () => number,
  allowTriplets = true,
): PatternEvent[] {
  const minNotes = minNotesForLevel(level);
  // Retry until we get a measure that both fills the bar and meets the note floor.
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const events = fillMeasure(beats, level, rng, allowTriplets);
      if (fillsBar(events, beats) && countNotes(events) >= minNotes)
        return events;
    } catch {
      // try again
    }
  }
  return fallback(beats);
}

/** Dense, all-quarter fallback — always satisfies the ≥3-note floor. */
function fallback(beats: number): PatternEvent[] {
  if (beats === 4) return [n("q"), n("q"), n("q"), n("q")];
  return [n("q"), n("q"), n("q")]; // 3 beats (3/4 or 6/8)
}

// ── Time signature selection ──────────────────────────────────────────────────

interface TimeSig {
  top: number;
  bottom: number;
  beats: number; // quarter-note beats per measure (4 for 4/4; 3 for 3/4 and 6/8)
  label: string;
}

function pickTimeSig(level: number, r: number): TimeSig {
  if (level <= 2) {
    return { top: 4, bottom: 4, beats: 4, label: "4/4" };
  }
  if (level === 3) {
    if (r < 0.2) return { top: 3, bottom: 4, beats: 3, label: "3/4" };
    return { top: 4, bottom: 4, beats: 4, label: "4/4" };
  }
  if (level === 4) {
    if (r < 0.28) return { top: 3, bottom: 4, beats: 3, label: "3/4" };
    return { top: 4, bottom: 4, beats: 4, label: "4/4" };
  }
  // Level 5: mix all three
  if (r < 0.22) return { top: 3, bottom: 4, beats: 3, label: "3/4" };
  if (r < 0.4) return { top: 6, bottom: 8, beats: 3, label: "6/8" };
  return { top: 4, bottom: 4, beats: 4, label: "4/4" };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface GeneratedMeasure {
  events: PatternEvent[];
  timeSigTop: number;
  timeSigBottom: number;
  label: string;
  level: number;
  /** Show percussion clef — false for consecutive same-time-sig measures. */
  showClef: boolean;
  /** Show time signature — false for consecutive same-time-sig measures. */
  showTimeSig: boolean;
}

const LEVEL_LABELS: Record<number, string[]> = {
  1: ["Steady", "Grounded", "Walking", "Simple"],
  2: ["Stepping", "Moving", "Striding", "Running"],
  3: ["Swing feel", "Triplet", "Lilting", "Long-short"],
  4: ["Offbeat", "Syncopated", "Backbeat", "Leaning"],
  5: ["Gallop", "Sixteenths", "Complex", "Intricate"],
};

/**
 * Generate `count` measures procedurally.
 * Deterministic: same `baseSeed` always yields the same sequence.
 */
export function generateReel(
  count: number,
  baseSeed = 1337,
  allowTriplets = true,
  minLevel = 1,
): GeneratedMeasure[] {
  const measures: GeneratedMeasure[] = [];
  let prevSigKey = "";

  for (let i = 0; i < count; i++) {
    // Difficulty ramp across the 24-measure reel:
    //   0–1  → level 1 (quarters and halves only — simple entry)
    //   2–4  → level 2 (adds eighth-note pairs)
    //   5–11 → level 3 (adds dotted figures, whole notes — more interesting)
    //  12–19 → level 4 (adds syncopation, offbeats)
    //  20–23 → level 5 (sixteenth groups, gallop/reverse-gallop)
    // minLevel lifts the floor so triplet-unlocked reels start at level 3+.
    const baseLevel = i < 2 ? 1 : i < 5 ? 2 : i < 12 ? 3 : i < 20 ? 4 : 5;
    const level = Math.max(baseLevel, minLevel);

    // Separate RNG streams for time-sig choice vs. note choices (avoids correlation)
    const timeSigRng = mulberry32(baseSeed + i * 7 + 3);
    const noteRng = mulberry32(baseSeed + i * 31 + level * 1000);

    const timeSig = pickTimeSig(level, timeSigRng());
    const { top, bottom, beats, label: sigLabel } = timeSig;

    let events = safeGenerate(beats, level, noteRng, allowTriplets);
    // The first measure must begin and end with a note — the player needs a
    // clear note to tap as their entry point into the game.
    if (i === 0) {
      events = ensureNoLeadingRest(events);
      events = ensureNoTrailingRest(events);
    }

    const sigKey = `${top}/${bottom}`;
    const isNewSig = sigKey !== prevSigKey;
    prevSigKey = sigKey;

    const labelChoices = LEVEL_LABELS[level] ?? ["Rhythm"];
    const label = `${sigLabel} · ${labelChoices[i % labelChoices.length]}`;

    measures.push({
      events,
      timeSigTop: top,
      timeSigBottom: bottom,
      label,
      level,
      showClef: isNewSig,
      showTimeSig: isNewSig,
    });
  }

  return measures;
}

// ── Concept-stage system (infinite, pedagogically sequenced) ──────────────────

export type DifficultyMode = "easy" | "intermediate" | "advanced";

interface TimeSigDef {
  top: number;
  bottom: number;
  beats: number;
}
interface ConceptStageSpec {
  name: string;
  oneBeatIdx: number[];
  twoBeatIdx: number[];
  fourBeatIdx: number[];
  timeSigs: TimeSigDef[];
}

// ONE_BEAT fill indices (see ONE_BEAT array above):
//   0=n(q)  1=n(q)dup  2=r(q)  3=n(8)+n(8)  4=triplet  5=n(8)+r(8)  6=r(8)+n(8)
//   7=r(8)+n(8)dup  8=4×n(16)  9=gallop  10=rev-gallop  11+12=offbeat 16ths
// TWO_BEAT fill indices:
//   0=n(h)  1=r(h)  2=q.+8  3=q.+r8  4=8+q.  5=sync-rest-tie  6=8+r(q)+8  7=r(q)+n(q)
// FOUR_BEAT fill indices: 0=n(w)  1=r(w)

const TS_44: TimeSigDef = { top: 4, bottom: 4, beats: 4 };
const TS_34: TimeSigDef = { top: 3, bottom: 4, beats: 3 };
const TS_68: TimeSigDef = { top: 6, bottom: 8, beats: 3 };

// Each stage is cumulative — fills and time sigs listed are ALL that are available.
// Stages are designed so each one introduces exactly one new rhythmic concept.
const CONCEPT_STAGES: ConceptStageSpec[] = [
  {
    name: "Quarter Notes",
    oneBeatIdx: [0, 1],
    twoBeatIdx: [],
    fourBeatIdx: [],
    timeSigs: [TS_44],
  },
  {
    name: "Half Notes",
    oneBeatIdx: [0, 1],
    twoBeatIdx: [0],
    fourBeatIdx: [],
    timeSigs: [TS_44],
  },
  {
    name: "Whole Notes",
    oneBeatIdx: [0, 1],
    twoBeatIdx: [0],
    fourBeatIdx: [0],
    timeSigs: [TS_44],
  },
  {
    name: "Eighth Notes",
    oneBeatIdx: [0, 1, 3],
    twoBeatIdx: [0],
    fourBeatIdx: [0],
    timeSigs: [TS_44],
  },
  {
    name: "Quarter Rests",
    oneBeatIdx: [0, 1, 2, 3],
    twoBeatIdx: [0],
    fourBeatIdx: [0],
    timeSigs: [TS_44],
  },
  {
    name: "Half Rests",
    oneBeatIdx: [0, 1, 2, 3],
    twoBeatIdx: [0, 1],
    fourBeatIdx: [0],
    timeSigs: [TS_44],
  },
  {
    name: "Dotted Rhythms",
    oneBeatIdx: [0, 1, 2, 3],
    twoBeatIdx: [0, 1, 2, 4],
    fourBeatIdx: [0],
    timeSigs: [TS_44],
  },
  {
    name: "3/4 Time",
    oneBeatIdx: [0, 1, 2, 3],
    twoBeatIdx: [0, 1, 2, 4],
    fourBeatIdx: [0],
    timeSigs: [TS_44, TS_34],
  },
  {
    name: "Syncopation",
    oneBeatIdx: [0, 1, 2, 3, 5, 6, 7],
    twoBeatIdx: [0, 1, 2, 4, 5, 6, 7],
    fourBeatIdx: [0],
    timeSigs: [TS_44, TS_34],
  },
  {
    name: "6/8 Time",
    oneBeatIdx: [0, 1, 2, 3, 5, 6, 7],
    twoBeatIdx: [0, 1, 2, 4, 5, 6, 7],
    fourBeatIdx: [0],
    timeSigs: [TS_44, TS_34, TS_68],
  },
  {
    name: "Triplets",
    oneBeatIdx: [0, 1, 2, 3, 4, 5, 6, 7],
    twoBeatIdx: [0, 1, 2, 4, 5, 6, 7],
    fourBeatIdx: [0],
    timeSigs: [TS_44, TS_34, TS_68],
  },
  {
    name: "Sixteenth Notes",
    oneBeatIdx: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    twoBeatIdx: [0, 1, 2, 3, 4, 5, 6, 7],
    fourBeatIdx: [0, 1],
    timeSigs: [TS_44, TS_34, TS_68],
  },
];

/** Number of measures to spend on each concept stage before advancing. */
const STAGE_LENGTH: Record<DifficultyMode, number> = {
  easy: 8,
  intermediate: 4,
  advanced: 2,
};

export function getConceptStageIndex(
  absIdx: number,
  mode: DifficultyMode,
): number {
  const len = STAGE_LENGTH[mode];
  // Stage 0 (quarter notes only) uses half the normal length in Easy — enough to
  // establish the pulse without overloading beginners with too many identical measures.

  // this was the original code, but it felt too slow to start with 4+ identical measures of quarter notes:
  // const stage0Len = mode === "easy" ? Math.ceil(len / 2) : len;

  const stage0Len = mode === "easy" ? Math.ceil(len / 4) : Math.ceil(len / 2);

  if (absIdx < stage0Len) return 0;
  return Math.min(
    1 + Math.floor((absIdx - stage0Len) / len),
    CONCEPT_STAGES.length - 1,
  );
}

export function getConceptStageName(
  absIdx: number,
  mode: DifficultyMode,
): string {
  return CONCEPT_STAGES[getConceptStageIndex(absIdx, mode)].name;
}

function fillMeasureWithStage(
  beats: number,
  stage: ConceptStageSpec,
  rng: () => number,
): PatternEvent[] {
  const events: PatternEvent[] = [];
  let remaining = beats;

  while (remaining > 0) {
    const eligible: Fill[] = [];
    if (remaining >= 4) {
      for (const idx of stage.fourBeatIdx) eligible.push(FOUR_BEAT[idx].fill);
    }
    if (remaining >= 2) {
      for (const idx of stage.twoBeatIdx) eligible.push(TWO_BEAT[idx].fill);
    }
    for (const idx of stage.oneBeatIdx) eligible.push(ONE_BEAT[idx].fill);
    if (eligible.length === 0) break;

    const fill = eligible[Math.floor(rng() * eligible.length)];
    events.push(...fill.map((e) => ({ ...e })));
    remaining -= fillBeats(fill);
    remaining = Math.round(remaining * 12) / 12;
  }
  return events;
}

function safeGenerateWithStage(
  beats: number,
  stage: ConceptStageSpec,
  rng: () => number,
): PatternEvent[] {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const events = fillMeasureWithStage(beats, stage, rng);
      if (fillsBar(events, beats) && countNotes(events) >= 1) return events;
    } catch {
      // try again
    }
  }
  return fallback(beats);
}

/**
 * Generate a single measure for any absolute index in an infinite game.
 * Fully deterministic: (absIdx, mode, baseSeed) → always the same measure.
 * Each index maps to a concept stage, so the stream introduces rhythmic ideas
 * one at a time and never repeats a previously seen measure.
 */
export function generateMeasureAtIndex(
  absIdx: number,
  mode: DifficultyMode,
  baseSeed: number,
): GeneratedMeasure {
  const stageIdx = getConceptStageIndex(absIdx, mode);
  const stage = CONCEPT_STAGES[stageIdx];

  const timeSigRng = mulberry32(baseSeed + absIdx * 7 + 3);
  const noteRng = mulberry32(baseSeed + absIdx * 31 + 997);

  const tsIdx = Math.floor(timeSigRng() * stage.timeSigs.length);
  const ts = stage.timeSigs[tsIdx];
  const { top, bottom, beats } = ts;

  let events = safeGenerateWithStage(beats, stage, noteRng);
  if (absIdx === 0) {
    events = ensureNoLeadingRest(events);
    events = ensureNoTrailingRest(events);
  }

  // Determine if the time signature changed from the previous measure.
  // We replay the previous measure's time-sig RNG to check — cheap and deterministic.
  let showClef = absIdx === 0;
  let showTimeSig = absIdx === 0;
  if (absIdx > 0) {
    const prevStageIdx = getConceptStageIndex(absIdx - 1, mode);
    const prevStage = CONCEPT_STAGES[prevStageIdx];
    const prevRng = mulberry32(baseSeed + (absIdx - 1) * 7 + 3);
    const prevTsIdx = Math.floor(prevRng() * prevStage.timeSigs.length);
    const prevTs = prevStage.timeSigs[prevTsIdx];
    const changed = prevTs.top !== top || prevTs.bottom !== bottom;
    showClef = changed;
    showTimeSig = changed;
  }

  // Map stage index (0–11) onto the 1–5 dot display used by NotationBlock
  const level = Math.min(Math.floor(stageIdx / 2) + 1, 5);

  return {
    events,
    timeSigTop: top,
    timeSigBottom: bottom,
    label: `${top}/${bottom} · ${stage.name}`,
    level,
    showClef,
    showTimeSig,
  };
}
