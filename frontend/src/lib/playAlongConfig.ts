/**
 * Play Along game configuration — stored in localStorage so the admin
 * can tune it without a code deploy.
 */

export interface TimeSigUnlock {
  top: number
  bottom: number
  /** Unlock this time sig after this many cumulative successful measures. */
  afterMeasures: number
}

export interface PlayAlongConfig {
  /** Starting tempo in BPM. */
  startBpm: number
  /** BPM ceiling — tempo will never exceed this. */
  bpmCap: number
  /** Increase BPM after this many successful measures. */
  bpmIncreaseAfterMeasures: number
  /** How many BPM to add per increase. */
  bpmIncreaseAmount: number
  /** Game resets after this many consecutive missed notes. */
  consecutiveMissesReset: number
  /** Time signatures that can appear and when they unlock. */
  timeSigs: TimeSigUnlock[]
}

export const DEFAULT_CONFIG: PlayAlongConfig = {
  startBpm: 50,
  bpmCap: 80,
  bpmIncreaseAfterMeasures: 10,
  bpmIncreaseAmount: 1,
  consecutiveMissesReset: 10,
  timeSigs: [
    { top: 4, bottom: 4, afterMeasures: 0 },
    { top: 3, bottom: 4, afterMeasures: 10 },
    { top: 6, bottom: 8, afterMeasures: 10 },
  ],
}

const STORAGE_KEY = 'rhythm:playalong-config'

export function loadPlayAlongConfig(): PlayAlongConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    // Merge with defaults so new keys are always present
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function savePlayAlongConfig(cfg: PlayAlongConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
}

/** The set of allowed time signatures given how many measures have been cleared. */
export function allowedTimeSigs(
  cfg: PlayAlongConfig,
  successfulMeasures: number,
): TimeSigUnlock[] {
  return cfg.timeSigs.filter(ts => ts.afterMeasures <= successfulMeasures)
}

/** Reel generation level to use given allowed time sigs. */
export function reelLevel(cfg: PlayAlongConfig, successfulMeasures: number): number {
  const unlocked = allowedTimeSigs(cfg, successfulMeasures)
  // If only 4/4 is unlocked use level 2 (all 4/4).
  // If any other time sig is unlocked use level 5 (mixed).
  return unlocked.length > 1 ? 5 : 2
}
