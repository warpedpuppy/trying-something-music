/**
 * Theory audio engine — synthesized piano / harpsichord tones for the theory
 * section of the app.  Completely independent of the metronome click engine.
 *
 * Architecture
 * ────────────
 * A single shared AudioContext routes everything through a master GainNode so
 * that stop() can silence all in-flight audio immediately.
 *
 * Each note is rendered as:
 *   Triangle oscillator (fundamental) + Sine oscillator (2nd harmonic, softer)
 *   → LowPassFilter (tames harshness) → per-note GainNode (ADSR) → masterGain
 *
 * The result is a mellow harpsichord-like tone — period-appropriate for Bach
 * and clear enough for chord/interval demonstration.
 */

// ── MIDI utilities ────────────────────────────────────────────────────────────

/** Convert a MIDI note number (0–127) to Hz. A4 = 69 = 440 Hz. */
export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Common MIDI note numbers for quick reference. */
export const MIDI = {
  C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59,
  C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, Bb4: 70, B4: 71,
  C5: 72, Db5: 73, D5: 74, Eb5: 75, E5: 76, F5: 77, Fs5: 78,
  G5: 79, Ab5: 80, A5: 81, Bb5: 82, B5: 83,
  C6: 84,
} as const

// ── Sequence types ────────────────────────────────────────────────────────────

/** A single chord event in a sequence. */
export interface ChordStep {
  /** MIDI note numbers sounding simultaneously. */
  notes: number[]
  /** Duration this chord is held before the next chord starts (seconds). */
  holdSec: number
  /** Optional label displayed over the chord (e.g. "V⁷"). */
  label?: string
}

// ── Audio engine ──────────────────────────────────────────────────────────────

class TheoryAudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  /** setTimeout IDs for onStep callbacks and onDone — cancelled by stop(). */
  private timers: number[] = []

  // ── Context bootstrap ────────────────────────────────────────────────────

  private ensureCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      type W = Window & { webkitAudioContext?: typeof AudioContext }
      const Ctor = window.AudioContext ?? (window as W).webkitAudioContext
      if (!Ctor) throw new Error('Web Audio API not available')
      this.ctx    = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 1
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  // ── Internal note renderer ───────────────────────────────────────────────

  /**
   * Schedule a single pitched note.
   *
   * @param ctx        AudioContext
   * @param midi       MIDI note number
   * @param when       AudioContext time to start (seconds)
   * @param durSec     How long to sustain before releasing (seconds)
   * @param gainScale  0–1 volume multiplier (default 1)
   */
  private scheduleNote(
    ctx: AudioContext,
    midi: number,
    when: number,
    durSec: number,
    gainScale = 1,
  ): void {
    const freq = midiToHz(midi)

    // Two oscillators for warmth
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    osc1.type = 'triangle'
    osc1.frequency.value = freq
    osc2.type = 'sine'
    osc2.frequency.value = freq * 2   // one octave up, very soft

    // Low-pass filter — softens the attack click and brightness
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = Math.min(4000, freq * 8)
    filter.Q.value = 0.5

    // Per-note gain with piano-like ADSR
    const gain = ctx.createGain()
    const attack  = 0.008
    const decay   = 0.12
    const sustain = 0.25 * gainScale   // sustain level (relative)
    const release = 0.35
    const peak    = 0.18 * gainScale

    gain.gain.setValueAtTime(0.001, when)
    gain.gain.linearRampToValueAtTime(peak, when + attack)
    gain.gain.exponentialRampToValueAtTime(sustain, when + attack + decay)
    // Hold sustain until release point
    gain.gain.setValueAtTime(sustain, when + durSec)
    gain.gain.exponentialRampToValueAtTime(0.001, when + durSec + release)

    // Mix: osc1 louder, osc2 very soft
    const mixGain1 = ctx.createGain(); mixGain1.gain.value = 0.85
    const mixGain2 = ctx.createGain(); mixGain2.gain.value = 0.15

    osc1.connect(mixGain1); mixGain1.connect(filter)
    osc2.connect(mixGain2); mixGain2.connect(filter)
    filter.connect(gain)
    gain.connect(this.master!)

    const end = when + durSec + release + 0.05
    osc1.start(when); osc1.stop(end)
    osc2.start(when); osc2.stop(end)
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Play a single note immediately.
   * @param midi     MIDI note number
   * @param durSec   Note duration (default 1.2s)
   */
  playNote(midi: number, durSec = 1.2): void {
    const ctx  = this.ensureCtx()
    // Restore gain in case stop() was called recently
    this.master!.gain.cancelScheduledValues(ctx.currentTime)
    this.master!.gain.setValueAtTime(1, ctx.currentTime)
    this.scheduleNote(ctx, midi, ctx.currentTime + 0.02, durSec)
  }

  /**
   * Play a chord (multiple notes simultaneously) immediately.
   * @param notes    Array of MIDI note numbers
   * @param durSec   Duration (default 2s)
   */
  playChord(notes: number[], durSec = 2): void {
    const ctx = this.ensureCtx()
    this.master!.gain.cancelScheduledValues(ctx.currentTime)
    this.master!.gain.setValueAtTime(1, ctx.currentTime)
    const when = ctx.currentTime + 0.02
    // Slightly arpeggiate (5ms between notes) for a natural pluck feel
    notes.forEach((midi, i) => {
      this.scheduleNote(ctx, midi, when + i * 0.005, durSec, 1 / Math.sqrt(notes.length))
    })
  }

  /**
   * Play two notes melodically (first, then second) then together.
   * Useful for interval demonstration.
   */
  playInterval(midi1: number, midi2: number, noteDurSec = 1): void {
    const ctx  = this.ensureCtx()
    this.master!.gain.cancelScheduledValues(ctx.currentTime)
    this.master!.gain.setValueAtTime(1, ctx.currentTime)
    const gap  = noteDurSec + 0.1
    const when = ctx.currentTime + 0.02
    this.scheduleNote(ctx, midi1, when, noteDurSec)
    this.scheduleNote(ctx, midi2, when + gap, noteDurSec)
    // Then both together
    this.scheduleNote(ctx, midi1, when + gap * 2, noteDurSec * 1.5)
    this.scheduleNote(ctx, midi2, when + gap * 2, noteDurSec * 1.5)
  }

  /**
   * Play a sequence of chord steps.
   *
   * @param steps      Array of ChordStep (notes + hold duration)
   * @param onStep     Called with step index as each chord starts
   * @param onDone     Called when the sequence finishes
   * @param startDelay Seconds before the first chord (default 0.1)
   */
  playSequence(
    steps: ChordStep[],
    onStep?: (index: number) => void,
    onDone?: () => void,
    startDelay = 0.1,
  ): void {
    this.stop()
    const ctx = this.ensureCtx()
    this.master!.gain.cancelScheduledValues(ctx.currentTime)
    this.master!.gain.setValueAtTime(1, ctx.currentTime)

    let cursor = ctx.currentTime + startDelay  // audio time
    let wallMs = performance.now() + startDelay * 1000  // wall clock

    steps.forEach((step, i) => {
      const when = cursor
      const wallAt = wallMs

      // Schedule audio
      step.notes.forEach((midi, ni) => {
        this.scheduleNote(ctx, midi, when + ni * 0.006, step.holdSec * 0.9, 1 / Math.sqrt(step.notes.length))
      })

      // Schedule JS callback (for UI highlighting)
      if (onStep) {
        const delay = Math.max(0, wallAt - performance.now())
        this.timers.push(window.setTimeout(() => onStep(i), delay))
      }

      cursor += step.holdSec
      wallMs += step.holdSec * 1000
    })

    // onDone callback
    if (onDone) {
      const tailSec = 0.5
      const delay = Math.max(0, wallMs - performance.now() + tailSec * 1000)
      this.timers.push(window.setTimeout(onDone, delay))
    }
  }

  /**
   * Play a polyphonic sequence of individual note events — used for
   * multi-voice excerpts like Bach inventions.
   *
   * @param events     Array of {midi, startSec, durSec} note events
   * @param onBeat     Called each time a new "beat group" starts (for animation)
   * @param onDone     Called when playback finishes
   */
  playPolyphonic(
    events: { midi: number; startSec: number; durSec: number; voice: 0 | 1 }[],
    onBeat?: (beatSec: number, voice: 0 | 1, midi: number) => void,
    onDone?: () => void,
  ): void {
    this.stop()
    const ctx  = this.ensureCtx()
    this.master!.gain.cancelScheduledValues(ctx.currentTime)
    this.master!.gain.setValueAtTime(1, ctx.currentTime)

    const startAudio = ctx.currentTime + 0.1
    const startWall  = performance.now() + 100

    // Find total duration
    let totalSec = 0

    events.forEach(ev => {
      this.scheduleNote(ctx, ev.midi, startAudio + ev.startSec, ev.durSec,
        ev.voice === 0 ? 0.9 : 0.7)   // treble slightly louder
      totalSec = Math.max(totalSec, ev.startSec + ev.durSec)

      if (onBeat) {
        const delayMs = ev.startSec * 1000
        this.timers.push(
          window.setTimeout(() => onBeat(ev.startSec, ev.voice, ev.midi),
            Math.max(0, startWall - performance.now() + delayMs))
        )
      }
    })

    if (onDone) {
      const delay = Math.max(0, startWall - performance.now() + (totalSec + 0.8) * 1000)
      this.timers.push(window.setTimeout(onDone, delay))
    }
  }

  /** Stop all playback immediately. */
  stop(): void {
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime)
      this.master.gain.setValueAtTime(0, this.ctx.currentTime)
      // Restore gain after a brief silence so next play works
      this.master.gain.setValueAtTime(1, this.ctx.currentTime + 0.05)
    }
    for (const t of this.timers) window.clearTimeout(t)
    this.timers = []
  }
}

/** Shared singleton — import this in any theory page. */
export const theoryAudio = new TheoryAudioEngine()

// ── Chord library (C major key) ───────────────────────────────────────────────

const { C3, D3, F3, G3, A3, C4, D4, E4, F4, G4, A4, B4, C5, D5, F5 } = MIDI

/**
 * Common chords in C major with bass note + upper voicing.
 * Voiced for clarity: bass an octave below, 3-note upper structure.
 */
export const CHORDS_C = {
  I:   { notes: [C3, C4, E4, G4, C5],  label: 'I',   name: 'C major'  },
  ii:  { notes: [D3, D4, F4, A4],       label: 'ii',  name: 'D minor'  },
  iii: { notes: [E4, G4, B4],           label: 'iii', name: 'E minor'  },
  IV:  { notes: [F3, C4, F4, A4, C5],   label: 'IV',  name: 'F major'  },
  V:   { notes: [G3, D4, G4, B4, D5],   label: 'V',   name: 'G major'  },
  V7:  { notes: [G3, D4, F4, G4, B4],   label: 'V⁷',  name: 'G dom 7' },
  vi:  { notes: [A3, C4, E4, A4],       label: 'vi',  name: 'A minor'  },
  vii: { notes: [B4, D5, F5],           label: 'vii°',name: 'B dim'    },
} as const

/** Pre-built cadence sequences, ready to pass to playSequence(). */
export const CADENCE_SEQUENCES = {
  /** V → I  (authentic / perfect authentic with V7) */
  authentic: [
    { notes: [...CHORDS_C.V7.notes], holdSec: 1.6, label: 'V⁷' },
    { notes: [...CHORDS_C.I.notes], holdSec: 2.2, label: 'I'  },
  ],
  /** IV → I  (plagal / "Amen") */
  plagal: [
    { notes: [...CHORDS_C.IV.notes], holdSec: 1.6, label: 'IV' },
    { notes: [...CHORDS_C.I.notes], holdSec: 2.2, label: 'I'  },
  ],
  /** I → V  (half cadence — phrase ends unresolved) */
  half: [
    { notes: [...CHORDS_C.I.notes], holdSec: 1.4, label: 'I' },
    { notes: [...CHORDS_C.V.notes], holdSec: 2.4, label: 'V' },
  ],
  /** V → vi  (deceptive) — give a I first so the ear has context */
  deceptive: [
    { notes: [...CHORDS_C.I.notes], holdSec: 0.9, label: 'I'  },
    { notes: [...CHORDS_C.V7.notes], holdSec: 1.4, label: 'V⁷' },
    { notes: [...CHORDS_C.vi.notes], holdSec: 2.2, label: 'vi' },
  ],
} as const

/** Pre-built progression sequences. */
export const PROGRESSION_SEQUENCES: Record<string, ChordStep[]> = {
  'I-IV-V-I': [
    { notes: [...CHORDS_C.I.notes], holdSec: 1.2, label: 'I'  },
    { notes: [...CHORDS_C.IV.notes], holdSec: 1.2, label: 'IV' },
    { notes: [...CHORDS_C.V.notes], holdSec: 1.2, label: 'V'  },
    { notes: [...CHORDS_C.I.notes], holdSec: 2.0, label: 'I'  },
  ],
  'I-V-vi-IV': [
    { notes: [...CHORDS_C.I.notes], holdSec: 1.2, label: 'I'  },
    { notes: [...CHORDS_C.V.notes], holdSec: 1.2, label: 'V'  },
    { notes: [...CHORDS_C.vi.notes], holdSec: 1.2, label: 'vi' },
    { notes: [...CHORDS_C.IV.notes], holdSec: 2.0, label: 'IV' },
  ],
  'I-vi-IV-V': [
    { notes: [...CHORDS_C.I.notes], holdSec: 1.2, label: 'I'  },
    { notes: [...CHORDS_C.vi.notes], holdSec: 1.2, label: 'vi' },
    { notes: [...CHORDS_C.IV.notes], holdSec: 1.2, label: 'IV' },
    { notes: [...CHORDS_C.V.notes], holdSec: 2.0, label: 'V'  },
  ],
  'ii-V-I': [
    { notes: [...CHORDS_C.ii.notes], holdSec: 1.2, label: 'ii' },
    { notes: [...CHORDS_C.V7.notes], holdSec: 1.2, label: 'V⁷' },
    { notes: [...CHORDS_C.I.notes], holdSec: 2.0, label: 'I'  },
  ],
}

// ── Bach Invention No. 1 in C Major (BWV 772) ─────────────────────────────────
//
// J.S. Bach, Two-Part Invention No. 1 in C Major.
// Public domain (Bach, 1685–1750). First 4 bars.
// All notes are 16th notes at 80 BPM (0.1875s each = 60/(80*4)*4... = 0.1875s)
// voice 0 = right hand (treble), voice 1 = left hand (bass)

const S = 0.1875  // one 16th note at 80 BPM in seconds

type BachNote = { midi: number; startSec: number; durSec: number; voice: 0 | 1 }

function rh(midi: number, beat: number): BachNote {
  return { midi, startSec: beat * S, durSec: S * 0.88, voice: 0 }
}
function lh(midi: number, beat: number): BachNote {
  return { midi, startSec: beat * S, durSec: S * 0.88, voice: 1 }
}

// Bar 1 (beats 0–15): right hand solo — the opening motive
// C D E F G A G F / E C D E F D E F
const BAR1_RH = [
  rh(MIDI.C5, 0),  rh(MIDI.D5, 1),  rh(MIDI.E5, 2),  rh(MIDI.F5, 3),
  rh(MIDI.G5, 4),  rh(MIDI.A5, 5),  rh(MIDI.G5, 6),  rh(MIDI.F5, 7),
  rh(MIDI.E5, 8),  rh(MIDI.C5, 9),  rh(MIDI.D5, 10), rh(MIDI.E5, 11),
  rh(MIDI.F5, 12), rh(MIDI.D5, 13), rh(MIDI.E5, 14), rh(MIDI.F5, 15),
]

// Bar 2 (beats 16–31): RH continues, LH enters with the same motive on C4
// RH: G A B A G F E D / C D C B A B C B
const BAR2_RH = [
  rh(MIDI.G5, 16), rh(MIDI.A5, 17), rh(MIDI.B5, 18), rh(MIDI.A5, 19),
  rh(MIDI.G5, 20), rh(MIDI.F5, 21), rh(MIDI.E5, 22), rh(MIDI.D5, 23),
  rh(MIDI.C5, 24), rh(MIDI.D5, 25), rh(MIDI.C5, 26), rh(MIDI.B4, 27),
  rh(MIDI.A4, 28), rh(MIDI.B4, 29), rh(MIDI.C5, 30), rh(MIDI.B4, 31),
]
// LH: same motive as bar 1 RH, starting on C4
const BAR2_LH = [
  lh(MIDI.C4, 16), lh(MIDI.D4, 17), lh(MIDI.E4, 18), lh(MIDI.F4, 19),
  lh(MIDI.G4, 20), lh(MIDI.A4, 21), lh(MIDI.G4, 22), lh(MIDI.F4, 23),
  lh(MIDI.E4, 24), lh(MIDI.C4, 25), lh(MIDI.D4, 26), lh(MIDI.E4, 27),
  lh(MIDI.F4, 28), lh(MIDI.D4, 29), lh(MIDI.E4, 30), lh(MIDI.F4, 31),
]

// Bar 3 (beats 32–47): both voices, moving toward G major
// RH: C D E D C B A G / F G F E D E F E
const BAR3_RH = [
  rh(MIDI.C5, 32), rh(MIDI.D5, 33), rh(MIDI.E5, 34), rh(MIDI.D5, 35),
  rh(MIDI.C5, 36), rh(MIDI.B4, 37), rh(MIDI.A4, 38), rh(MIDI.G4, 39),
  rh(MIDI.F4, 40), rh(MIDI.G4, 41), rh(MIDI.F4, 42), rh(MIDI.E4, 43),
  rh(MIDI.D4, 44), rh(MIDI.E4, 45), rh(MIDI.F4, 46), rh(MIDI.E4, 47),
]
// LH: G A B A G F E D / C D C B A B C B
const BAR3_LH = [
  lh(MIDI.G4, 32), lh(MIDI.A4, 33), lh(MIDI.B4, 34), lh(MIDI.A4, 35),
  lh(MIDI.G4, 36), lh(MIDI.F4, 37), lh(MIDI.E4, 38), lh(MIDI.D4, 39),
  lh(MIDI.C4, 40), lh(MIDI.D4, 41), lh(MIDI.C4, 42), lh(MIDI.B3, 43),
  lh(MIDI.A3, 44), lh(MIDI.B3, 45), lh(MIDI.C4, 46), lh(MIDI.B3, 47),
]

// Bar 4 (beats 48–63): approaches half-cadence on G major
// RH: D E F E D C B A / G A G F E F G F
const BAR4_RH = [
  rh(MIDI.D4, 48), rh(MIDI.E4, 49), rh(MIDI.F4, 50), rh(MIDI.E4, 51),
  rh(MIDI.D4, 52), rh(MIDI.C4, 53), rh(MIDI.B3, 54), rh(MIDI.A3, 55),  // adjusted for register
  rh(MIDI.G4, 56), rh(MIDI.A4, 57), rh(MIDI.G4, 58), rh(MIDI.F4, 59),
  rh(MIDI.E4, 60), rh(MIDI.F4, 61), rh(MIDI.G4, 62), rh(MIDI.F4, 63),
]
// LH: C D E D C B A G / F G A G F E D C
const BAR4_LH = [
  lh(MIDI.C4, 48), lh(MIDI.D4, 49), lh(MIDI.E4, 50), lh(MIDI.D4, 51),
  lh(MIDI.C4, 52), lh(MIDI.B3, 53), lh(MIDI.A3, 54), lh(MIDI.G3, 55),
  lh(MIDI.F3, 56), lh(MIDI.G3, 57), lh(MIDI.A3, 58), lh(MIDI.G3, 59),
  lh(MIDI.F3, 60), lh(MIDI.E3, 61), lh(MIDI.D3, 62), lh(MIDI.C3, 63),
]

/**
 * J.S. Bach — Two-Part Invention No. 1 in C Major (BWV 772).
 * Opening 4 bars. Public domain.
 * voice 0 = right hand, voice 1 = left hand.
 */
export const BACH_INVENTION_1: BachNote[] = [
  ...BAR1_RH,
  ...BAR2_RH, ...BAR2_LH,
  ...BAR3_RH, ...BAR3_LH,
  ...BAR4_RH, ...BAR4_LH,
]

export const BACH_INVENTION_1_DURATION_SEC = 64 * S   // ≈ 12 seconds at 80 BPM
