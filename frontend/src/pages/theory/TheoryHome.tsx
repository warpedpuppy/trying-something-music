import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Topic {
  title: string
  description: string
  icon: string
  href: string
  available: boolean
}

interface Level {
  name: 'Beginner' | 'Intermediate' | 'Advanced'
  tagline: string
  topics: Topic[]
}

type Tab = 'overview' | 'beginner' | 'intermediate' | 'advanced'

const LEVELS: Level[] = [
  // ── Beginner ──────────────────────────────────────────────────────────────
  {
    name: 'Beginner',
    tagline: 'The foundations — reading notation, understanding pitch and rhythm.',
    topics: [
      {
        title: 'Notes & the Staff',
        description: 'Read and name notes on the treble and bass clef. Learn how pitch is written on the page.',
        icon: '𝄞',
        href: '/theory/notes',
        available: false,
      },
      {
        title: 'Key Signatures',
        description: 'Sharps and flats at the clef. How to identify them instantly and know which key you\'re in.',
        icon: '♯',
        href: '/theory/keys',
        available: false,
      },
      {
        title: 'Intervals',
        description: 'Measure the distance between two pitches. The building block of all melody and harmony.',
        icon: '↕',
        href: '/theory/intervals',
        available: false,
      },
      {
        title: 'Scales & the Major Scale',
        description: 'The major scale is the foundation of Western harmony. Learn its pattern, its sound, and why it works.',
        icon: '〰',
        href: '/theory/scales',
        available: false,
      },
      {
        title: 'Triads & Basic Chords',
        description: 'Stack three notes and you get a triad — major, minor, diminished, or augmented. The atoms of harmony.',
        icon: '♩',
        href: '/theory/chords',
        available: false,
      },
      {
        title: 'Cadences',
        description: 'The punctuation of music. Authentic, plagal, half, and deceptive cadences — how phrases begin, continue, and end.',
        icon: '‖',
        href: '/theory/cadences',
        available: false,
      },
      {
        title: 'Chord Progressions',
        description: 'The patterns that drive tonal music — I–IV–V, I–V–vi–IV, and the logic behind why they work.',
        icon: '→',
        href: '/theory/progressions',
        available: false,
      },
    ],
  },

  // ── Intermediate ──────────────────────────────────────────────────────────
  {
    name: 'Intermediate',
    tagline: 'Key relationships, harmonic function, and the grammar of tonal music.',
    topics: [
      {
        title: 'Circle of Fifths',
        description: 'The map of all 12 keys. Explore key signatures, relative minors, and the seven diatonic chords of any key — interactively.',
        icon: '◎',
        href: '/theory/circle-of-fifths',
        available: true,
      },
      {
        title: 'Diatonic Harmony & Roman Numerals',
        description: 'Analyse chords by function rather than letter name. Why I–V–vi–IV works the same in C, G, and F♯.',
        icon: 'Ⅳ',
        href: '/theory/diatonic-harmony',
        available: false,
      },
      {
        title: 'Voice Leading',
        description: 'The invisible logic that makes a chord progression feel smooth. How individual voices move between chords.',
        icon: '↝',
        href: '/theory/voice-leading',
        available: false,
      },
      {
        title: 'Secondary Dominants',
        description: 'Borrow the V chord from a neighboring key to pull toward any diatonic chord. The first step outside the home key.',
        icon: 'V/V',
        href: '/theory/secondary-dominants',
        available: false,
      },
      {
        title: 'Borrowed Chords & Modal Mixture',
        description: 'Pull chords from the parallel minor into a major key (and vice versa) — the ♭VII in rock, the iv in a ballad.',
        icon: '♭',
        href: '/theory/modal-mixture',
        available: false,
      },
      {
        title: 'The 12-Bar Blues',
        description: 'A structure so universal it deserves its own lesson. I7, IV7, V7, and how dominant sevenths redefine a key.',
        icon: '♬',
        href: '/theory/blues',
        available: false,
      },
      {
        title: 'Chord Symbols & Lead Sheets',
        description: 'Read real-world notation: Cmaj7, G7♭9, Dm11. The language of jazz charts, pop sheets, and gigging musicians.',
        icon: '7',
        href: '/theory/chord-symbols',
        available: false,
      },
    ],
  },

  // ── Advanced ──────────────────────────────────────────────────────────────
  {
    name: 'Advanced',
    tagline: 'Modulation, extended harmony, jazz theory, and compositional technique.',
    topics: [
      {
        title: 'Modulation',
        description: 'Move from one key to another mid-piece using pivot chords, direct modulation, or chromatic sleight-of-hand.',
        icon: '⟳',
        href: '/theory/modulation',
        available: false,
      },
      {
        title: 'Modes as Tonal Centers',
        description: 'Dorian, Phrygian, Lydian, Mixolydian — not just scale patterns but independent sonic worlds. The basis of modal jazz.',
        icon: '≈',
        href: '/theory/modes',
        available: false,
      },
      {
        title: 'Extended & Altered Chords',
        description: 'Add 9ths, 11ths, 13ths, and alterations (♭9, ♯11, ♭13) to build the lush, complex harmonies of jazz and film music.',
        icon: '⁹',
        href: '/theory/extended-chords',
        available: false,
      },
      {
        title: 'Tritone Substitution',
        description: 'Replace any V7 chord with the chord a tritone away — one of the most elegant ideas in jazz harmony.',
        icon: '♭Ⅱ',
        href: '/theory/tritone-sub',
        available: false,
      },
      {
        title: 'Counterpoint',
        description: 'Two or more independent melodic lines that work together. The foundation of Bach, and the underlying logic of any good arrangement.',
        icon: '⇄',
        href: '/theory/counterpoint',
        available: false,
      },
      {
        title: 'Form & Structure',
        description: 'Binary, ternary, AABA, verse-chorus, sonata-allegro. How large-scale repetition and contrast shape an entire piece.',
        icon: '▦',
        href: '/theory/form',
        available: false,
      },
      {
        title: 'Reharmonization',
        description: 'Keep the melody; change the chords underneath. A creative technique that reveals how harmony and melody are independent dimensions.',
        icon: '⟲',
        href: '/theory/reharmonization',
        available: false,
      },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_BADGE_CLASS: Record<Level['name'], string> = {
  Beginner:     'theory-level-badge theory-level-badge-beginner',
  Intermediate: 'theory-level-badge theory-level-badge-intermediate',
  Advanced:     'theory-level-badge theory-level-badge-advanced',
}

const TAB_TO_LEVEL: Record<'beginner' | 'intermediate' | 'advanced', Level['name']> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
}

function TopicCard({ topic }: { topic: Topic }) {
  if (topic.available) {
    return (
      <Link to={topic.href} className="theory-card">
        <span className="theory-card-icon">{topic.icon}</span>
        <div>
          <h3>{topic.title}</h3>
          <p>{topic.description}</p>
        </div>
      </Link>
    )
  }
  return (
    <div className="theory-card theory-card-soon">
      <span className="theory-card-icon">{topic.icon}</span>
      <div>
        <h3>
          {topic.title}
          <span className="coming-soon-badge">Coming soon</span>
        </h3>
        <p>{topic.description}</p>
      </div>
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ onSelectTab }: { onSelectTab: (tab: Tab) => void }) {
  const LEVEL_CARDS: Array<{
    tab: 'beginner' | 'intermediate' | 'advanced'
    emoji: string
    heading: string
    blurb: string
    badge: string
    badgeClass: string
  }> = [
    {
      tab: 'beginner',
      emoji: '🌱',
      heading: 'Beginner',
      blurb: 'Notes on the staff, key signatures, intervals, scales, and the chords that set tonal music in motion.',
      badge: 'Beginner',
      badgeClass: 'theory-level-badge-beginner',
    },
    {
      tab: 'intermediate',
      emoji: '🎹',
      heading: 'Intermediate',
      blurb: 'The Circle of Fifths, diatonic harmony, voice leading, secondary dominants, and the blues.',
      badge: 'Intermediate',
      badgeClass: 'theory-level-badge-intermediate',
    },
    {
      tab: 'advanced',
      emoji: '🎷',
      heading: 'Advanced',
      blurb: 'Modulation, modes as tonal centers, extended chords, tritone substitution, counterpoint, and reharmonization.',
      badge: 'Advanced',
      badgeClass: 'theory-level-badge-advanced',
    },
  ]

  return (
    <div className="theory-overview">
      <div className="theory-overview-hero">
        <h2 className="theory-overview-title">Understand the language behind the music</h2>
        <p className="theory-overview-body">
          From reading a note on the staff to the harmonic tricks that make jazz sound like jazz —
          work through the levels in order or jump straight to whatever catches your curiosity.
          Every lesson is interactive, visual, and built to stick.
        </p>
      </div>

      <div className="theory-overview-cards">
        {LEVEL_CARDS.map(({ tab, emoji, heading, blurb, badge, badgeClass }) => (
          <button
            key={tab}
            type="button"
            className="theory-overview-card"
            onClick={() => onSelectTab(tab)}
          >
            <span className="theory-overview-card-emoji">{emoji}</span>
            <div className="theory-overview-card-body">
              <span className={`theory-level-badge ${badgeClass}`}>{badge}</span>
              <h3 className="theory-overview-card-heading">{heading}</h3>
              <p className="theory-overview-card-blurb">{blurb}</p>
              <span className="theory-overview-card-cta">Explore →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Level tab ─────────────────────────────────────────────────────────────────

function LevelTab({ level }: { level: Level }) {
  return (
    <section className="theory-level-section">
      <div className="theory-level-header">
        <span className={LEVEL_BADGE_CLASS[level.name]}>{level.name}</span>
        <p className="theory-level-tagline">{level.tagline}</p>
      </div>
      <div className="theory-grid">
        {level.topics.map((topic) => (
          <TopicCard key={topic.title} topic={topic} />
        ))}
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function TheoryHome() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const TAB_LABELS: Array<{ id: Tab; label: string }> = [
    { id: 'overview',     label: 'Overview' },
    { id: 'beginner',     label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced',     label: 'Advanced' },
  ]

  return (
    <div>
      <section className="theory-hero">
        <h1>Music Theory</h1>
      </section>

      {/* Tab bar */}
      <div className="theory-tabs" role="tablist">
        {TAB_LABELS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={`theory-tab-btn${activeTab === id ? ' active' : ''}${
              id !== 'overview' ? ` theory-tab-btn-${id}` : ''
            }`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="theory-tab-content">
        {activeTab === 'overview' && <OverviewTab onSelectTab={setActiveTab} />}
        {activeTab !== 'overview' && (
          <LevelTab level={LEVELS.find(l => l.name === TAB_TO_LEVEL[activeTab as 'beginner' | 'intermediate' | 'advanced'])!} />
        )}
      </div>
    </div>
  )
}
