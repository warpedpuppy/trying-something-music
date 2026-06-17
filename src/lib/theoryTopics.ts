/**
 * Shared theory-topic metadata used by UserProfile, TheoryPractice, and badges.
 * Single source of truth for slug groupings and human-readable labels.
 */

export const THEORY_LEVELS = [
  {
    name: 'Beginner' as const,
    slugs: ['notes', 'keys', 'intervals', 'scales', 'chords', 'cadences', 'progressions'],
  },
  {
    name: 'Intermediate' as const,
    slugs: ['circle-of-fifths', 'diatonic-harmony', 'voice-leading', 'secondary-dominants',
            'modal-mixture', 'blues', 'chord-symbols'],
  },
  {
    name: 'Advanced' as const,
    slugs: ['modulation', 'modes', 'extended-chords', 'tritone-sub',
            'counterpoint', 'form', 'reharmonization'],
  },
]

export const THEORY_TOPIC_LABELS: Record<string, string> = {
  'circle-of-fifths':    'Circle of Fifths',
  'notes':               'Notes & the Staff',
  'keys':                'Key Signatures',
  'intervals':           'Intervals',
  'scales':              'Scales',
  'chords':              'Triads & Chords',
  'cadences':            'Cadences',
  'progressions':        'Chord Progressions',
  'diatonic-harmony':    'Diatonic Harmony',
  'voice-leading':       'Voice Leading',
  'secondary-dominants': 'Secondary Dominants',
  'modal-mixture':       'Modal Mixture',
  'blues':               'The Blues',
  'chord-symbols':       'Chord Symbols',
  'modulation':          'Modulation',
  'modes':               'Modes',
  'extended-chords':     'Extended Chords',
  'tritone-sub':         'Tritone Substitution',
  'counterpoint':        'Counterpoint',
  'form':                'Form & Structure',
  'reharmonization':     'Reharmonization',
}
