import { Link, useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useAuth } from '../../auth/useAuth'
import { getTheoryCompletions } from '../../lib/localDb'

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
        available: true,
      },
      {
        title: 'Scales: Major & Minor',
        description: 'The two patterns — W–W–H and W–H–W — that define the sound of every major and minor key in Western music.',
        icon: '〰',
        href: '/theory/scales',
        available: true,
      },
      {
        title: 'Key Signatures',
        description: 'Sharps and flats at the clef. How to identify them instantly and know which key you\'re in.',
        icon: '♯',
        href: '/theory/keys',
        available: true,
      },
      {
        title: 'Intervals',
        description: 'Measure the distance between two pitches. The building block of all melody and harmony.',
        icon: '↕',
        href: '/theory/intervals',
        available: true,
      },
      {
        title: 'Triads & Basic Chords',
        description: 'Stack three notes and you get a triad — major, minor, diminished, or augmented. The atoms of harmony.',
        icon: '♩',
        href: '/theory/chords',
        available: true,
      },
      {
        title: 'Cadences',
        description: 'The punctuation of music. Authentic, plagal, half, and deceptive cadences — how phrases begin, continue, and end.',
        icon: '‖',
        href: '/theory/cadences',
        available: true,
      },
      {
        title: 'Chord Progressions',
        description: 'The patterns that drive tonal music — I–IV–V, I–V–vi–IV, and the logic behind why they work.',
        icon: '→',
        href: '/theory/progressions',
        available: true,
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
        available: true,
      },
      {
        title: 'Voice Leading',
        description: 'The invisible logic that makes a chord progression feel smooth. How individual voices move between chords.',
        icon: '↝',
        href: '/theory/voice-leading',
        available: true,
      },
      {
        title: 'Secondary Dominants',
        description: 'Borrow the V chord from a neighboring key to pull toward any diatonic chord. The first step outside the home key.',
        icon: 'V/V',
        href: '/theory/secondary-dominants',
        available: true,
      },
      {
        title: 'Borrowed Chords & Modal Mixture',
        description: 'Pull chords from the parallel minor into a major key (and vice versa) — the ♭VII in rock, the iv in a ballad.',
        icon: '♭',
        href: '/theory/modal-mixture',
        available: true,
      },
      {
        title: 'The 12-Bar Blues',
        description: 'A structure so universal it deserves its own lesson. I7, IV7, V7, and how dominant sevenths redefine a key.',
        icon: '♬',
        href: '/theory/blues',
        available: true,
      },
      {
        title: 'Chord Symbols & Lead Sheets',
        description: 'Read real-world notation: Cmaj7, G7♭9, Dm11. The language of jazz charts, pop sheets, and gigging musicians.',
        icon: '7',
        href: '/theory/chord-symbols',
        available: true,
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
        available: true,
      },
      {
        title: 'Modes as Tonal Centers',
        description: 'Dorian, Phrygian, Lydian, Mixolydian — not just scale patterns but independent sonic worlds. The basis of modal jazz.',
        icon: '≈',
        href: '/theory/modes',
        available: true,
      },
      {
        title: 'Extended & Altered Chords',
        description: 'Add 9ths, 11ths, 13ths, and alterations (♭9, ♯11, ♭13) to build the lush, complex harmonies of jazz and film music.',
        icon: '⁹',
        href: '/theory/extended-chords',
        available: true,
      },
      {
        title: 'Tritone Substitution',
        description: 'Replace any V7 chord with the chord a tritone away — one of the most elegant ideas in jazz harmony.',
        icon: '♭Ⅱ',
        href: '/theory/tritone-sub',
        available: true,
      },
      {
        title: 'Counterpoint',
        description: 'Two or more independent melodic lines that work together. The foundation of Bach, and the underlying logic of any good arrangement.',
        icon: '⇄',
        href: '/theory/counterpoint',
        available: true,
      },
      {
        title: 'Form & Structure',
        description: 'Binary, ternary, AABA, verse-chorus, sonata-allegro. How large-scale repetition and contrast shape an entire piece.',
        icon: '▦',
        href: '/theory/form',
        available: true,
      },
      {
        title: 'Reharmonization',
        description: 'Keep the melody; change the chords underneath. A creative technique that reveals how harmony and melody are independent dimensions.',
        icon: '⟲',
        href: '/theory/reharmonization',
        available: true,
      },
    ],
  },
]

// ── Derived stats ─────────────────────────────────────────────────────────────

const ALL_TOPICS     = LEVELS.flatMap((l) => l.topics)
const AVAILABLE_TOPICS = ALL_TOPICS.filter((t) => t.available)

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugFromHref(href: string): string {
  return href.split('/').pop() ?? ''
}

const LEVEL_BADGE_CLASS: Record<Level['name'], string> = {
  Beginner:     'theory-level-badge theory-level-badge-beginner',
  Intermediate: 'theory-level-badge theory-level-badge-intermediate',
  Advanced:     'theory-level-badge theory-level-badge-advanced',
}

const LEVEL_ROUTE: Record<Level['name'], string> = {
  Beginner:     '/theory/beginner',
  Intermediate: '/theory/intermediate',
  Advanced:     '/theory/advanced',
}

function TopicCard({ topic, completed }: { topic: Topic; completed: boolean }) {
  return (
    <Link to={topic.href} className={`theory-card${completed ? ' theory-card-completed' : ''}`}>
      <span className="theory-card-icon">{topic.icon}</span>
      <div>
        <h3>
          {topic.title}
          {completed && <span className="theory-card-done">✓</span>}
        </h3>
        <p>{topic.description}</p>
      </div>
    </Link>
  )
}

// ── Theory Dashboard ──────────────────────────────────────────────────────────

function TheoryDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const completions = user ? getTheoryCompletions(user.id) : []
  const completedCount = ALL_TOPICS.filter((t) => completions.includes(slugFromHref(t.href))).length

  return (
    <div className="theory-dashboard">
      {/* Stats row */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{AVAILABLE_TOPICS.length}</div>
          <div className="stat-label">Topics available</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedCount}</div>
          <div className="stat-label">Sections completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{LEVELS.length}</div>
          <div className="stat-label">Levels</div>
        </div>
      </div>

      {/* Level breakdown */}
      <h2 style={{ marginBottom: '12px' }}>Explore by level</h2>
      <div className="theory-dashboard-levels">
        {LEVELS.map((level) => {
          const levelCompleted = level.topics.filter((t) => completions.includes(slugFromHref(t.href))).length
          return (
            <button
              key={level.name}
              type="button"
              className="theory-dashboard-level-card"
              onClick={() => navigate(LEVEL_ROUTE[level.name])}
            >
              <div className="theory-dashboard-level-top">
                <span className={LEVEL_BADGE_CLASS[level.name]}>{level.name}</span>
                <span className="theory-dashboard-level-count">
                  {levelCompleted} / {level.topics.length} completed
                </span>
              </div>
              <p className="theory-dashboard-level-tagline">{level.tagline}</p>
              <div className="theory-dashboard-level-bar">
                <div
                  className="theory-dashboard-level-bar-fill"
                  style={{ width: `${(levelCompleted / level.topics.length) * 100}%` }}
                />
              </div>
              <span className="theory-overview-card-cta">Browse topics →</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Level section (shared between level pages) ────────────────────────────────

export function LevelSection({ level }: { level: Level }) {
  const { user } = useAuth()
  const completions = user ? getTheoryCompletions(user.id) : []

  return (
    <section className="theory-level-section">
      <div className="theory-level-header">
        <span className={LEVEL_BADGE_CLASS[level.name]}>{level.name}</span>
        <p className="theory-level-tagline">{level.tagline}</p>
      </div>
      <div className="theory-grid">
        {level.topics.map((topic) => (
          <TopicCard
            key={topic.title}
            topic={topic}
            completed={completions.includes(slugFromHref(topic.href))}
          />
        ))}
      </div>
    </section>
  )
}

// ── Route-level pages ─────────────────────────────────────────────────────────

/** /theory — the dashboard */
export function TheoryHome() {
  usePageTitle('Music Theory')
  return (
    <div>
      <section className="theory-hero">
        <h1>Music Theory</h1>
      </section>
      <TheoryDashboard />
    </div>
  )
}

/** /theory/beginner | /theory/intermediate | /theory/advanced */
export function TheoryLevelPage({ levelName }: { levelName: Level['name'] }) {
  usePageTitle(`${levelName} Theory`)
  const level = LEVELS.find((l) => l.name === levelName)!
  return <LevelSection level={level} />
}
