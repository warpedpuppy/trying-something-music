import { Link } from 'react-router-dom'

interface Topic {
  title: string
  description: string
  icon: string
  href: string
  available: boolean
}

const TOPICS: Topic[] = [
  {
    title: 'Notes & the Staff',
    description: 'Read and name notes on the treble and bass clef. Learn how pitch is written on the page.',
    icon: '𝄞',
    href: '/theory/notes',
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
    title: 'Scales & Modes',
    description: 'Major, natural minor, harmonic minor, and all seven modes of the major scale.',
    icon: '〰',
    href: '/theory/scales',
    available: false,
  },
  {
    title: 'Chords',
    description: 'Build triads, dominant sevenths, and extended chords. Understand how they function.',
    icon: '𝄢',
    href: '/theory/chords',
    available: false,
  },
  {
    title: 'Key Signatures',
    description: 'Sharps and flats at the clef. How to read them, how to find the key.',
    icon: '♯',
    href: '/theory/keys',
    available: false,
  },
  {
    title: 'Chord Progressions',
    description: 'The patterns that drive tonal music — I–IV–V, ii–V–I, and beyond.',
    icon: '♩',
    href: '/theory/progressions',
    available: false,
  },
]

export function TheoryHome() {
  return (
    <div>
      <section className="theory-hero">
        <h1>Music Theory</h1>
        <p>
          Understand the language behind the music — from reading a note on the staff to
          building the chord progressions that give songs their emotional pull.
        </p>
      </section>

      <div className="theory-grid">
        {TOPICS.map((topic) => (
          topic.available ? (
            <Link key={topic.title} to={topic.href} className="theory-card">
              <span className="theory-card-icon">{topic.icon}</span>
              <div>
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>
              </div>
            </Link>
          ) : (
            <div key={topic.title} className="theory-card theory-card-soon">
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
        ))}
      </div>
    </div>
  )
}
