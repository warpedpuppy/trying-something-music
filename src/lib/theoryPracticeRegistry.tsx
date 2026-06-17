/**
 * Maps each theory topic slug to a lazily-loaded practice quiz component.
 * The quiz component is the same one embedded in that topic's Practice tab,
 * so practice here is identical to practice on the topic page itself.
 *
 * Only slugs present here will appear in the central Practice tab.
 * slugs map 1-to-1 with the href slugs in TheoryHome's LEVELS constant.
 */
import { lazy } from 'react'
import type { ComponentType } from 'react'

export const PRACTICE_REGISTRY: Record<string, ComponentType> = {
  // ── Beginner ────────────────────────────────────────────────────────────────
  notes:               lazy(() => import('../pages/theory/NotesAndStaff').then(m => ({ default: m.NotesQuiz }))),
  keys:                lazy(() => import('../pages/theory/KeySignatures').then(m => ({ default: m.KeySigsQuiz }))),
  intervals:           lazy(() => import('../pages/theory/Intervals').then(m => ({ default: m.IntervalsQuiz }))),
  scales:              lazy(() => import('../pages/theory/ScalesPage').then(m => ({ default: m.ScalesQuiz }))),
  chords:              lazy(() => import('../pages/theory/Chords').then(m => ({ default: m.ChordsQuiz }))),
  cadences:            lazy(() => import('../pages/theory/Cadences').then(m => ({ default: m.CadencesQuiz }))),
  progressions:        lazy(() => import('../pages/theory/Progressions').then(m => ({ default: m.ProgressionsQuiz }))),
  // ── Intermediate ────────────────────────────────────────────────────────────
  'circle-of-fifths':  lazy(() => import('../pages/theory/CircleOfFifths').then(m => ({ default: m.CircleOfFifthsInteractive }))),
  'diatonic-harmony':  lazy(() => import('../pages/theory/DiatonicHarmony').then(m => ({ default: m.Quiz }))),
  'voice-leading':     lazy(() => import('../pages/theory/VoiceLeading').then(m => ({ default: m.VLQuiz }))),
  'secondary-dominants': lazy(() => import('../pages/theory/SecondaryDominants').then(m => ({ default: m.SDQuiz }))),
  'modal-mixture':     lazy(() => import('../pages/theory/ModalMixture').then(m => ({ default: m.Quiz }))),
  blues:               lazy(() => import('../pages/theory/Blues').then(m => ({ default: m.Quiz }))),
  'chord-symbols':     lazy(() => import('../pages/theory/ChordSymbols').then(m => ({ default: m.Quiz }))),
  // ── Advanced ────────────────────────────────────────────────────────────────
  modulation:          lazy(() => import('../pages/theory/Modulation').then(m => ({ default: m.ModQuiz }))),
  modes:               lazy(() => import('../pages/theory/Modes').then(m => ({ default: m.Quiz }))),
  'extended-chords':   lazy(() => import('../pages/theory/ExtendedChords').then(m => ({ default: m.Quiz }))),
  'tritone-sub':       lazy(() => import('../pages/theory/TritoneSubstitution').then(m => ({ default: m.TSQuiz }))),
  counterpoint:        lazy(() => import('../pages/theory/Counterpoint').then(m => ({ default: m.Quiz }))),
  form:                lazy(() => import('../pages/theory/FormAndStructure').then(m => ({ default: m.Quiz }))),
  reharmonization:     lazy(() => import('../pages/theory/Reharmonization').then(m => ({ default: m.Quiz }))),
}
