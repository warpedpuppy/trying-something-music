// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// localStorage shim: node environment doesn't expose window.localStorage
const lsData = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem:    (k: string)          => lsData.get(k) ?? null,
    setItem:    (k: string, v: string) => { lsData.set(k, v) },
    removeItem: (k: string)          => { lsData.delete(k) },
    clear:      ()                   => { lsData.clear() },
    get length() { return lsData.size },
  },
  writable: true,
  configurable: true,
})

import {
  DEFAULT_CONFIG,
  loadPlayAlongConfig,
  savePlayAlongConfig,
  allowedTimeSigs,
  reelLevel,
  type PlayAlongConfig,
} from './playAlongConfig'

// ── DEFAULT_CONFIG ────────────────────────────────────────────────────────────

describe('DEFAULT_CONFIG', () => {
  it('has startBpm of 60', () => {
    expect(DEFAULT_CONFIG.startBpm).toBe(60)
  })

  it('has bpmCap higher than startBpm', () => {
    expect(DEFAULT_CONFIG.bpmCap).toBeGreaterThan(DEFAULT_CONFIG.startBpm)
  })

  it('has positive bpmIncreaseAfterMeasures', () => {
    expect(DEFAULT_CONFIG.bpmIncreaseAfterMeasures).toBeGreaterThan(0)
  })

  it('has positive bpmIncreaseAmount', () => {
    expect(DEFAULT_CONFIG.bpmIncreaseAmount).toBeGreaterThan(0)
  })

  it('has positive consecutiveMissesReset', () => {
    expect(DEFAULT_CONFIG.consecutiveMissesReset).toBeGreaterThan(0)
  })

  it('includes 4/4 at afterMeasures 0', () => {
    const base = DEFAULT_CONFIG.timeSigs.find(ts => ts.top === 4 && ts.bottom === 4)
    expect(base).toBeDefined()
    expect(base!.afterMeasures).toBe(0)
  })
})

// ── loadPlayAlongConfig ───────────────────────────────────────────────────────

describe('loadPlayAlongConfig', () => {
  beforeEach(() => lsData.clear())
  afterEach(() => lsData.clear())

  it('returns defaults when nothing is stored', () => {
    const cfg = loadPlayAlongConfig()
    expect(cfg.startBpm).toBe(DEFAULT_CONFIG.startBpm)
    expect(cfg.bpmCap).toBe(DEFAULT_CONFIG.bpmCap)
  })

  it('merges a saved partial config with defaults', () => {
    localStorage.setItem('rhythm:playalong-config', JSON.stringify({ startBpm: 72 }))
    const cfg = loadPlayAlongConfig()
    expect(cfg.startBpm).toBe(72)
    // Keys not in saved config fall back to defaults
    expect(cfg.bpmCap).toBe(DEFAULT_CONFIG.bpmCap)
    expect(cfg.consecutiveMissesReset).toBe(DEFAULT_CONFIG.consecutiveMissesReset)
  })

  it('returns defaults when stored JSON is corrupt', () => {
    localStorage.setItem('rhythm:playalong-config', '{ not valid json }}}')
    const cfg = loadPlayAlongConfig()
    expect(cfg.startBpm).toBe(DEFAULT_CONFIG.startBpm)
  })

  it('round-trips through savePlayAlongConfig', () => {
    const custom: PlayAlongConfig = {
      ...DEFAULT_CONFIG,
      startBpm: 70,
      bpmCap: 120,
    }
    savePlayAlongConfig(custom)
    const loaded = loadPlayAlongConfig()
    expect(loaded.startBpm).toBe(70)
    expect(loaded.bpmCap).toBe(120)
  })
})

// ── allowedTimeSigs ───────────────────────────────────────────────────────────

describe('allowedTimeSigs', () => {
  const cfg: PlayAlongConfig = {
    ...DEFAULT_CONFIG,
    timeSigs: [
      { top: 4, bottom: 4, afterMeasures: 0 },
      { top: 3, bottom: 4, afterMeasures: 10 },
      { top: 6, bottom: 8, afterMeasures: 20 },
    ],
  }

  it('only returns 4/4 at 0 successful measures', () => {
    const sigs = allowedTimeSigs(cfg, 0)
    expect(sigs).toHaveLength(1)
    expect(sigs[0]).toMatchObject({ top: 4, bottom: 4 })
  })

  it('unlocks 3/4 at 10 successful measures', () => {
    const sigs = allowedTimeSigs(cfg, 10)
    expect(sigs).toHaveLength(2)
    expect(sigs.some(s => s.top === 3)).toBe(true)
  })

  it('unlocks all time sigs at 20 successful measures', () => {
    const sigs = allowedTimeSigs(cfg, 20)
    expect(sigs).toHaveLength(3)
  })

  it('never returns more sigs than configured', () => {
    expect(allowedTimeSigs(cfg, 9999)).toHaveLength(3)
  })
})

// ── reelLevel ─────────────────────────────────────────────────────────────────

describe('reelLevel', () => {
  const cfg: PlayAlongConfig = {
    ...DEFAULT_CONFIG,
    timeSigs: [
      { top: 4, bottom: 4, afterMeasures: 0 },
      { top: 3, bottom: 4, afterMeasures: 10 },
    ],
  }

  it('returns level 2 when only 4/4 is unlocked', () => {
    expect(reelLevel(cfg, 0)).toBe(2)
    expect(reelLevel(cfg, 9)).toBe(2)
  })

  it('returns level 5 when a non-4/4 time sig unlocks', () => {
    expect(reelLevel(cfg, 10)).toBe(5)
    expect(reelLevel(cfg, 50)).toBe(5)
  })
})
