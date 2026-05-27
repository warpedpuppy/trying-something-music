import type { Exercise } from '../api/types'
import { tapCount } from '../lib/rhythm'

function n(duration: Exercise['pattern']['events'][0]['duration'], dots = 0, tie = false) {
  const e: Exercise['pattern']['events'][0] = { type: 'note', duration }
  if (dots) e.dots = dots
  if (tie) e.tieToNext = true
  return e
}

function r(duration: Exercise['pattern']['events'][0]['duration'], dots = 0) {
  const e: Exercise['pattern']['events'][0] = { type: 'rest', duration }
  if (dots) e.dots = dots
  return e
}

type ExerciseSeed = Omit<Exercise, 'tap_count'>

const seeds: ExerciseSeed[] = [
  // Level 1 — quarter & half notes
  {
    id: 1, title: 'Four steady quarters',
    description: 'Four quarter notes — one tap on every beat, all evenly spaced.',
    level: 1, concept: 'note-values', learn_section: 'note-values',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 80, is_active: true,
    pattern: { events: [n('q'), n('q'), n('q'), n('q')] },
  },
  {
    id: 2, title: 'Half then quarters',
    description: 'A half note lasts two beats: tap it, hold the silence, then tap the two quarters.',
    level: 1, concept: 'note-values', learn_section: 'note-values',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 80, is_active: true,
    pattern: { events: [n('h'), n('q'), n('q')] },
  },
  {
    id: 3, title: 'Quarters and a half',
    description: 'Two quick quarters, then let the half note ring for two full beats.',
    level: 1, concept: 'note-values', learn_section: 'note-values',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 80, is_active: true,
    pattern: { events: [n('q'), n('q'), n('h')] },
  },

  // Level 2 — whole notes & time signatures
  {
    id: 4, title: 'The whole note',
    description: 'A whole note fills the entire measure — one tap, then wait four beats before the quarters.',
    level: 2, concept: 'time-signatures', learn_section: 'time-signatures',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 2, tempo_bpm: 80, is_active: true,
    pattern: { events: [n('w'), n('q'), n('q'), n('q'), n('q')] },
  },
  {
    id: 5, title: 'Waltz time',
    description: 'Three beats per measure in 3/4 time. Feel the ONE-two-three.',
    level: 2, concept: 'time-signatures', learn_section: 'time-signatures',
    time_sig_top: 3, time_sig_bottom: 4, num_measures: 2, tempo_bpm: 90, is_active: true,
    pattern: { events: [n('q'), n('q'), n('q'), n('h'), n('q')] },
  },
  {
    id: 6, title: 'Mixed long notes',
    description: 'Halves and quarters across two measures of 4/4.',
    level: 2, concept: 'time-signatures', learn_section: 'time-signatures',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 2, tempo_bpm: 80, is_active: true,
    pattern: { events: [n('h'), n('q'), n('q'), n('q'), n('q'), n('h')] },
  },

  // Level 3 — rests
  {
    id: 7, title: 'Mind the gap',
    description: "A quarter rest is one beat of silence. Don't tap during it!",
    level: 3, concept: 'rests', learn_section: 'rests',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 80, is_active: true,
    pattern: { events: [n('q'), r('q'), n('q'), n('q')] },
  },
  {
    id: 8, title: 'Rest in the middle',
    description: 'A two-beat rest separates the phrases. Keep counting through the silence.',
    level: 3, concept: 'rests', learn_section: 'rests',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 2, tempo_bpm: 80, is_active: true,
    pattern: { events: [n('q'), n('q'), r('h'), n('h'), n('q'), n('q')] },
  },
  {
    id: 9, title: 'Starting with silence',
    description: 'Each measure begins with a rest — your first tap lands on beat two.',
    level: 3, concept: 'rests', learn_section: 'rests',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 2, tempo_bpm: 80, is_active: true,
    pattern: { events: [r('q'), n('q'), n('q'), n('q'), r('q'), n('q'), n('h')] },
  },

  // Level 4 — eighth notes
  {
    id: 10, title: 'Walking and running',
    description: 'Eighth notes move twice as fast as quarters. Walk, walk, run-run, walk.',
    level: 4, concept: 'eighth-notes', learn_section: 'eighth-notes',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 76, is_active: true,
    pattern: { events: [n('q'), n('q'), n('8'), n('8'), n('q')] },
  },
  {
    id: 11, title: 'Eighth-note pairs',
    description: 'Two pairs of eighths, then two quarters. Keep the eighths perfectly even.',
    level: 4, concept: 'eighth-notes', learn_section: 'eighth-notes',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 76, is_active: true,
    pattern: { events: [n('8'), n('8'), n('8'), n('8'), n('q'), n('q')] },
  },
  {
    id: 12, title: 'Eighths around a rest',
    description: 'An eighth rest is half a beat of silence tucked between notes.',
    level: 4, concept: 'eighth-notes', learn_section: 'eighth-notes',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 72, is_active: true,
    pattern: { events: [n('8'), n('8'), n('q'), r('8'), n('8'), n('q')] },
  },

  // Level 5 — dotted notes
  {
    id: 13, title: 'The dotted half',
    description: "A dot adds half the note's value: a dotted half lasts three full beats.",
    level: 5, concept: 'dotted-notes', learn_section: 'dotted-notes',
    time_sig_top: 3, time_sig_bottom: 4, num_measures: 2, tempo_bpm: 84, is_active: true,
    pattern: { events: [n('h', 1), n('q'), n('q'), n('q')] },
  },
  {
    id: 14, title: 'Dotted quarter plus eighth',
    description: 'The classic long-short pair: a dotted quarter (1½ beats) followed by an eighth.',
    level: 5, concept: 'dotted-notes', learn_section: 'dotted-notes',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 76, is_active: true,
    pattern: { events: [n('q', 1), n('8'), n('q'), n('q')] },
  },
  {
    id: 15, title: 'Long-short, long-short',
    description: 'Two dotted-quarter-plus-eighth pairs in a row, then even quarters to finish.',
    level: 5, concept: 'dotted-notes', learn_section: 'dotted-notes',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 2, tempo_bpm: 76, is_active: true,
    pattern: { events: [n('q', 1), n('8'), n('q', 1), n('8'), n('q'), n('q'), n('h')] },
  },

  // Level 6 — ties
  {
    id: 16, title: 'Across the barline',
    description: 'The tie joins the last note of measure one to the first note of measure two — tap once, hold through both.',
    level: 6, concept: 'ties', learn_section: 'ties',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 2, tempo_bpm: 80, is_active: true,
    pattern: { events: [n('q'), n('q'), n('q'), n('q', 0, true), n('q'), n('q'), n('q'), n('q')] },
  },
  {
    id: 17, title: 'Tied eighths',
    description: 'Two eighths tied together sound like a single quarter note — only the first one is tapped.',
    level: 6, concept: 'ties', learn_section: 'ties',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 76, is_active: true,
    pattern: { events: [n('q'), n('8'), n('8', 0, true), n('8'), n('8'), n('q')] },
  },
  {
    id: 18, title: 'Holding on',
    description: 'A half note tied to another half rings for four full beats.',
    level: 6, concept: 'ties', learn_section: 'ties',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 2, tempo_bpm: 80, is_active: true,
    pattern: { events: [n('q'), n('q'), n('h', 0, true), n('h'), n('q'), n('q')] },
  },

  // Level 7 — sixteenths & syncopation
  {
    id: 19, title: 'Sixteenth runs',
    description: 'Four sixteenths fit inside one beat. Keep them light and even.',
    level: 7, concept: 'sixteenths', learn_section: 'sixteenths',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 69, is_active: true,
    pattern: { events: [n('16'), n('16'), n('16'), n('16'), n('q'), n('8'), n('8'), n('q')] },
  },
  {
    id: 20, title: 'Sixteenth combinations',
    description: "Eighth-and-two-sixteenths, then two-sixteenths-and-an-eighth. Say it: 'rhy-thm-of the-mu-sic'.",
    level: 7, concept: 'sixteenths', learn_section: 'sixteenths',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 69, is_active: true,
    pattern: { events: [n('8'), n('16'), n('16'), n('q'), n('16'), n('16'), n('8'), n('q')] },
  },
  {
    id: 21, title: 'Off the beat',
    description: 'Syncopation puts the long notes between the beats. Lean into the off-beats.',
    level: 7, concept: 'syncopation', learn_section: 'syncopation',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 1, tempo_bpm: 76, is_active: true,
    pattern: { events: [n('8'), n('q'), n('q'), n('q'), n('8')] },
  },
  {
    id: 22, title: 'The Charleston',
    description: 'The most famous syncopated figure: a dotted quarter, then a note tied over the third beat.',
    level: 7, concept: 'syncopation', learn_section: 'syncopation',
    time_sig_top: 4, time_sig_bottom: 4, num_measures: 2, tempo_bpm: 80, is_active: true,
    pattern: { events: [n('q', 1), n('8', 0, true), n('h'), n('q', 1), n('8'), n('q'), r('q')] },
  },
]

export const SEED_EXERCISES: Exercise[] = seeds.map((s) => ({
  ...s,
  tap_count: tapCount(s.pattern),
}))
