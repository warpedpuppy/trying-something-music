/**
 * Pure timing functions for the Play Along reel.
 * Kept side-effect-free so they are fully unit-testable.
 */

/** Pixel width of one rendered measure slot. Must match SLOT_PX in PlayAlong.tsx. */
export const SLOT_PX = 380

/** The read-line / cursor sits 25% from the left of the viewport. */
export const CURSOR_FRAC = 0.25

// ── Tempo ─────────────────────────────────────────────────────────────────────

/** Milliseconds for one 4/4 measure at the given BPM. */
export function msPerMeasure(bpm: number): number {
  return (4 * 60_000) / bpm
}

/** Milliseconds per quarter-note beat at the given BPM. */
export function msPerBeat(bpm: number): number {
  return 60_000 / bpm
}

// ── Reel position ─────────────────────────────────────────────────────────────

/**
 * CSS translateX (px) for the reel track at `elapsed` ms since play started.
 *
 * - elapsed = 0  → first measure's left edge is exactly at the cursor (vpWidth * CURSOR_FRAC).
 * - elapsed > 0  → reel scrolls left at a constant rate of SLOT_PX per msPerMeasure.
 *
 * @param elapsed    ms since the player clicked START (0 = beginning of play)
 * @param vpWidth    viewport width in pixels
 * @param mspM       ms per measure at the current BPM
 * @param loopMs     total reel loop duration in ms (reelUnique * mspM)
 */
export function reelTranslateX(
  elapsed: number,
  vpWidth: number,
  mspM: number,
  loopMs: number,
): number {
  const startOffset = vpWidth * CURSOR_FRAC
  if (elapsed <= 0) return startOffset
  const raw = elapsed % loopMs
  return startOffset - raw * (SLOT_PX / mspM)
}

// ── Measure index ─────────────────────────────────────────────────────────────

/**
 * Which reel measure (0 .. reelUnique-1) is at the cursor at `elapsed` ms.
 * Returns 0 when elapsed ≤ 0 (static / not yet started).
 */
export function measureAtCursor(
  elapsed: number,
  mspM: number,
  reelUnique: number,
): number {
  if (elapsed <= 0) return 0
  return Math.floor(elapsed / mspM) % reelUnique
}

/**
 * Total (non-looped) measure count that has fully passed the cursor.
 * Used to track BPM progression and time-sig unlocks.
 */
export function totalMeasuresPassed(elapsed: number, mspM: number): number {
  if (elapsed <= 0) return 0
  return Math.floor(elapsed / mspM)
}

// ── Onset timing ──────────────────────────────────────────────────────────────

/**
 * Elapsed-ms at which a note beat is directly under the cursor.
 *
 * @param measureAbsIdx   absolute (non-looped) measure index (0, 1, 2, …)
 * @param beatQuarters    beat position in quarter-note units (from expectedOnsets)
 * @param mspM            ms per measure
 * @param bpm             current BPM (for quarter-note ms calculation)
 */
export function onsetDueMs(
  measureAbsIdx: number,
  beatQuarters: number,
  mspM: number,
  bpm: number,
): number {
  return measureAbsIdx * mspM + beatQuarters * msPerBeat(bpm)
}

// ── Arrow / beat indicator ────────────────────────────────────────────────────

/**
 * Whether the downbeat arrow should be shown.
 * During the static phase the arrow is always shown (pointing to the first note).
 * During play it flashes only on beat index 0.
 */
export function shouldShowDownbeat(
  phase: 'static' | 'playing',
  beatIndex: number | null,
): boolean {
  if (phase === 'static') return true
  return beatIndex === 0
}
