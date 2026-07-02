import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Vitest 4 + jsdom 29 do not expose window.localStorage; the app relies on it for the
// auth token, so provide an in-memory implementation for tests.
if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
  const store = new Map<string, string>()
  const localStorageStub: Storage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
  }
  Object.defineProperty(window, 'localStorage', { value: localStorageStub, writable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageStub, writable: true })
} else if (typeof window !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: window.localStorage, writable: true })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  if (typeof window !== 'undefined') window.localStorage.clear()
})

class MockOscillator {
  type = 'square'
  frequency = { value: 0 }
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class MockGain {
  gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  }
  connect = vi.fn()
}

class MockAudioContext {
  state = 'running'
  destination = {}
  resume = vi.fn().mockResolvedValue(undefined)
  createOscillator = vi.fn(() => new MockOscillator())
  createGain = vi.fn(() => new MockGain())

  // A real AudioContext's clock advances continuously; mimic that by deriving the
  // time from performance.now() while still letting tests jump the clock by
  // assigning to currentTime.
  private origin = performance.now()
  private offset = 0

  get currentTime(): number {
    return this.offset + (performance.now() - this.origin) / 1000
  }

  set currentTime(value: number) {
    this.offset = value - (performance.now() - this.origin) / 1000
  }
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'AudioContext', {
    writable: true,
    value: MockAudioContext,
  })
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    } as unknown as typeof ResizeObserver
  }

  const canvasContext = {
    arc: vi.fn(),
    beginPath: vi.fn(),
    bezierCurveTo: vi.fn(),
    clearRect: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    measureText: vi.fn((text: string) => ({
      width: text.length * 8,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
    })),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    rect: vi.fn(),
    restore: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    setLineDash: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    strokeText: vi.fn(),
    transform: vi.fn(),
    translate: vi.fn(),
  }

  Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    value: vi.fn(() => canvasContext),
  })
}
