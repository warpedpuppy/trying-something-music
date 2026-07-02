import { describe, expect, it } from 'vitest'
import { nextSuccessfulMeasureCount } from './useGameLoop'

describe('nextSuccessfulMeasureCount', () => {
  it('increments when the completed measure has no misses', () => {
    expect(nextSuccessfulMeasureCount(4, new Set(), 2)).toBe(5)
  })

  it('does not increment when the completed measure has a miss', () => {
    expect(nextSuccessfulMeasureCount(4, new Set([2]), 2)).toBe(4)
  })
})
