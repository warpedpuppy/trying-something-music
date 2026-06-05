import { describe, expect, it } from 'vitest'
import { PRACTICE_REGISTRY } from './theoryPracticeRegistry'
import { THEORY_TOPIC_SLUGS } from './badges'

describe('theoryPracticeRegistry', () => {
  it('has an entry for every theory topic slug', () => {
    for (const slug of THEORY_TOPIC_SLUGS) {
      expect(PRACTICE_REGISTRY, `missing registry entry for slug "${slug}"`).toHaveProperty(slug)
    }
  })

  it('has no extra entries beyond the known topic slugs', () => {
    const knownSlugs = new Set(THEORY_TOPIC_SLUGS)
    for (const slug of Object.keys(PRACTICE_REGISTRY)) {
      expect(knownSlugs, `unexpected registry entry "${slug}" not in THEORY_TOPIC_SLUGS`).toContain(slug)
    }
  })

  it('every entry is a non-null defined value (lazy component)', () => {
    for (const [slug, component] of Object.entries(PRACTICE_REGISTRY)) {
      expect(component, `entry for "${slug}" is null or undefined`).toBeDefined()
      expect(component, `entry for "${slug}" is null`).not.toBeNull()
    }
  })

  it('registry length matches THEORY_TOPIC_SLUGS length', () => {
    expect(Object.keys(PRACTICE_REGISTRY).length).toBe(THEORY_TOPIC_SLUGS.length)
  })
})
