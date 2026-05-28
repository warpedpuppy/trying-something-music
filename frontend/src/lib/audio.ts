/**
 * Web Audio tick engine.
 *
 * All audio is routed through a master gain node so that `cancelAll()` can
 * immediately silence any clicks that were pre-scheduled in the audio graph
 * (which cannot otherwise be "unscheduled" once committed to the AudioContext).
 */

type TickKind = 'tap' | 'playback' | 'metronome'

const CLICK_PEAK_GAIN: Record<TickKind, number> = { tap: 0.4, playback: 0.4, metronome: 0.2 }
const CLICK_FREQUENCY: Record<TickKind, number> = { tap: 1000, playback: 1500, metronome: 620 }
const CLICK_WAVE: Record<TickKind, OscillatorType> = {
  tap: 'square',
  playback: 'square',
  metronome: 'triangle',
}

export interface ScheduledPlayback {
  cancel: () => void
}

export class TickEngine {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private timers: number[] = []
  private metronomeTimer: number | null = null
  private metronomeBeatTimers: number[] = []
  private nextMetronomeBeat = 0

  private ensureContext(): AudioContext {
    if (!this.context) {
      type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }
      const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
      if (!Ctor) throw new Error('Web Audio is not supported in this browser')
      this.context = new Ctor()
      this.masterGain = this.context.createGain()
      this.masterGain.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') void this.context.resume()
    return this.context
  }

  /** Restore master gain to 1 — called before any new audio to undo a previous cancelAll(). */
  private unmute(): void {
    if (this.masterGain && this.context) {
      this.masterGain.gain.cancelScheduledValues(this.context.currentTime)
      this.masterGain.gain.setValueAtTime(1, this.context.currentTime)
    }
  }

  /** Play a short click right now. */
  tick(kind: TickKind = 'tap'): void {
    const context = this.ensureContext()
    this.unmute()
    this.click(context, context.currentTime, kind)
  }

  private click(context: AudioContext, when: number, kind: TickKind): void {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = CLICK_WAVE[kind]
    oscillator.frequency.value = CLICK_FREQUENCY[kind]
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(CLICK_PEAK_GAIN[kind], when + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.06)
    oscillator.connect(gain)
    gain.connect(this.masterGain!)   // route through master so cancelAll() can silence it
    oscillator.start(when)
    oscillator.stop(when + 0.08)
  }

  /**
   * Click steadily at `bpm` until `stopMetronome()` is called.
   *
   * `onBeat(index, wallTimeMs)` fires around the time each beat sounds.
   * `wallTimeMs` is the beat's position on the `performance.now()` clock computed
   * from the audio schedule, so it stays accurate even when the callback fires late.
   *
   * `stopAfterBeats` — if provided, the engine schedules exactly this many audio
   * clicks and then auto-stops the interval.
   */
  startMetronome(
    bpm: number,
    onBeat?: (index: number, wallTimeMs: number) => void,
    stopAfterBeats?: number,
  ): void {
    this.stopMetronome()
    const context = this.ensureContext()
    this.unmute()
    const beatSeconds = 60 / bpm
    const lookaheadSeconds = 0.2
    this.nextMetronomeBeat = context.currentTime + 0.05
    let beatIndex = 0

    const scheduleWindow = () => {
      while (this.nextMetronomeBeat < context.currentTime + lookaheadSeconds) {
        if (stopAfterBeats !== undefined && beatIndex >= stopAfterBeats) {
          if (this.metronomeTimer !== null) {
            window.clearInterval(this.metronomeTimer)
            this.metronomeTimer = null
          }
          return
        }

        this.click(context, this.nextMetronomeBeat, 'metronome')

        if (onBeat) {
          const delayMs = Math.max(0, (this.nextMetronomeBeat - context.currentTime) * 1000)
          const wallTimeMs = performance.now() + delayMs
          const index = beatIndex
          this.metronomeBeatTimers.push(
            window.setTimeout(() => onBeat(index, wallTimeMs), delayMs),
          )
        }

        beatIndex += 1
        this.nextMetronomeBeat += beatSeconds
      }
    }

    scheduleWindow()
    this.metronomeTimer = window.setInterval(scheduleWindow, 100)
  }

  stopMetronome(): void {
    if (this.metronomeTimer !== null) {
      window.clearInterval(this.metronomeTimer)
      this.metronomeTimer = null
    }
    for (const timer of this.metronomeBeatTimers) window.clearTimeout(timer)
    this.metronomeBeatTimers = []
  }

  get metronomeRunning(): boolean {
    return this.metronomeTimer !== null
  }

  /**
   * Tick out a rhythm. `offsetsMs[i]` is when note `i` should sound, relative to now.
   * `onNote(i)` fires as each note sounds and `onDone` fires after the last note.
   *
   * `startDelayMs` — ms from now to the first note (default 100). Pass a larger value
   * to align playback with a running metronome downbeat.
   */
  playSchedule(
    offsetsMs: number[],
    onNote: (index: number) => void,
    onDone: () => void,
    tailMs = 600,
    startDelayMs = 100,
  ): ScheduledPlayback {
    const context = this.ensureContext()
    this.unmute()
    const start = context.currentTime + startDelayMs / 1000
    offsetsMs.forEach((offset, index) => {
      this.click(context, start + offset / 1000, 'playback')
      this.timers.push(window.setTimeout(() => onNote(index), startDelayMs + offset))
    })
    const last = offsetsMs.length > 0 ? offsetsMs[offsetsMs.length - 1] : 0
    this.timers.push(window.setTimeout(onDone, startDelayMs + last + tailMs))
    return { cancel: () => this.cancelAll() }
  }

  /** Register a one-shot callback that will be cancelled by `cancelAll()`. */
  scheduleCallback(delayMs: number, fn: () => void): void {
    this.timers.push(window.setTimeout(fn, delayMs))
  }

  cancelAll(): void {
    // Cut master gain to silence any pre-scheduled audio in the lookahead buffer.
    // Gain is restored to 1 the next time startMetronome(), playSchedule(), or tick() is called.
    if (this.masterGain && this.context) {
      this.masterGain.gain.cancelScheduledValues(this.context.currentTime)
      this.masterGain.gain.setValueAtTime(0, this.context.currentTime)
    }
    for (const timer of this.timers) window.clearTimeout(timer)
    this.timers = []
    this.stopMetronome()
  }
}

export const tickEngine = new TickEngine()
