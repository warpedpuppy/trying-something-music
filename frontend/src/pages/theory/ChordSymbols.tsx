/**
 * Chord Symbols & Lead Sheets — theory topic page.
 */
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz, type QuizMode } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

interface ChordType {
  symbol: string       // e.g. "maj7"
  name: string         // e.g. "Major 7th"
  intervals: string    // e.g. "1 – 3 – 5 – 7"
  example: string      // e.g. "Cmaj7 = C–E–G–B"
  description: string
}

const CHORD_TYPES: ChordType[] = [
  {
    symbol: '',
    name: 'Major triad',
    intervals: '1 – 3 – 5',
    example: 'C = C–E–G',
    description: 'No suffix = major. Bright, stable.',
  },
  {
    symbol: 'm',
    name: 'Minor triad',
    intervals: '1 – ♭3 – 5',
    example: 'Cm = C–E♭–G',
    description: 'Lowercase "m" = minor. Darker quality.',
  },
  {
    symbol: '7',
    name: 'Dominant 7th',
    intervals: '1 – 3 – 5 – ♭7',
    example: 'C7 = C–E–G–B♭',
    description: 'Major triad + minor 7th. Tension demanding resolution.',
  },
  {
    symbol: 'maj7',
    name: 'Major 7th',
    intervals: '1 – 3 – 5 – 7',
    example: 'Cmaj7 = C–E–G–B',
    description: 'Major triad + major 7th. Lush, dreamy quality.',
  },
  {
    symbol: 'm7',
    name: 'Minor 7th',
    intervals: '1 – ♭3 – 5 – ♭7',
    example: 'Cm7 = C–E♭–G–B♭',
    description: 'Minor triad + minor 7th. Smooth, jazzy — the ii chord in a ii–V–I.',
  },
  {
    symbol: 'm7♭5',
    name: 'Half-diminished',
    intervals: '1 – ♭3 – ♭5 – ♭7',
    example: 'Cm7♭5 = C–E♭–G♭–B♭',
    description: 'Also written ø. The vii chord in jazz minor harmony.',
  },
  {
    symbol: 'dim7',
    name: 'Diminished 7th',
    intervals: '1 – ♭3 – ♭5 – ♭♭7',
    example: 'Cdim7 = C–E♭–G♭–A',
    description: 'All minor 3rds. Symmetrical — any note can be the root.',
  },
  {
    symbol: 'sus4',
    name: 'Suspended 4th',
    intervals: '1 – 4 – 5',
    example: 'Csus4 = C–F–G',
    description: 'The 3rd is replaced by the 4th. Unresolved, floating feel.',
  },
  {
    symbol: 'aug',
    name: 'Augmented',
    intervals: '1 – 3 – ♯5',
    example: 'Caug = C–E–G♯',
    description: 'Raised 5th. Unstable, often used as a passing chord.',
  },
  {
    symbol: '9',
    name: 'Dominant 9th',
    intervals: '1 – 3 – 5 – ♭7 – 9',
    example: 'C9 = C–E–G–B♭–D',
    description: 'Dominant 7th + the 9th (= 2nd an octave up). Fuller, more colourful.',
  },
  {
    symbol: 'maj9',
    name: 'Major 9th',
    intervals: '1 – 3 – 5 – 7 – 9',
    example: 'Cmaj9 = C–E–G–B–D',
    description: 'Cmaj7 with an added 9th. Rich, impressionistic.',
  },
  {
    symbol: 'add9',
    name: 'Add 9',
    intervals: '1 – 3 – 5 – 9',
    example: 'Cadd9 = C–E–G–D',
    description: 'Major triad + 9th, no 7th. Lighter than a 9th chord.',
  },
]

interface CSQuestion {
  chord: ChordType
  questionType: 'name-from-symbol' | 'symbol-from-name' | 'intervals-from-symbol'
}

function csPick(excludeSymbol?: string): CSQuestion {
  const pool = excludeSymbol ? CHORD_TYPES.filter(c => c.symbol !== excludeSymbol) : CHORD_TYPES
  const chord = pool[Math.floor(Math.random() * pool.length)]
  const types: CSQuestion['questionType'][] = ['name-from-symbol', 'symbol-from-name', 'intervals-from-symbol']
  const questionType = types[Math.floor(Math.random() * types.length)]
  return { chord, questionType }
}

function csChoices(q: CSQuestion): string[] {
  const { questionType, chord } = q
  let answer: string
  let pool: string[]

  if (questionType === 'name-from-symbol') {
    answer = chord.name
    pool = CHORD_TYPES.map(c => c.name)
  } else if (questionType === 'symbol-from-name') {
    answer = chord.symbol || '(none)'
    pool = CHORD_TYPES.map(c => c.symbol || '(none)')
  } else {
    answer = chord.intervals
    pool = CHORD_TYPES.map(c => c.intervals)
  }

  const others = [...new Set(pool.filter(v => v !== answer))].sort(() => Math.random() - 0.5).slice(0, 3)
  return [...others, answer].sort(() => Math.random() - 0.5)
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a lead sheet?</h2>
        <p>
          A <strong>lead sheet</strong> shows just the melody line and chord symbols above it —
          no full piano or guitar notation, no written-out accompaniment. Musicians are expected
          to know what each symbol means and create an appropriate accompaniment on the fly.
          Lead sheets are the standard format for jazz standards, pop songs, and gigging musicians.
        </p>
        <p>
          Reading chord symbols fluently is as important for working musicians as reading standard notation.
          Once you know the system, a three-letter symbol like "Dm7♭5" tells you exactly what six
          notes to play.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The chord symbol system</h2>
        <p>
          Every chord symbol follows the same logic: <strong>Root note + quality suffix</strong>.
          The root is always a capital letter (C, F♯, B♭). The suffix describes the chord type.
          No suffix means major. Everything else is specified explicitly.
        </p>
        <div className="tt-sig-table" style={{ marginTop: 14 }}>
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '70px 130px 1fr' }}>
            <span>Suffix</span><span>Name</span><span>Example</span>
          </div>
          {CHORD_TYPES.map(ct => (
            <div key={ct.symbol || 'major'} className="tt-sig-row" style={{ gridTemplateColumns: '70px 130px 1fr' }}>
              <span className="tt-sig-key" style={{ fontFamily: 'Georgia, serif' }}>{ct.symbol || '—'}</span>
              <span className="tt-sig-notes">{ct.name}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.85rem' }}>{ct.example}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>Slash chords</h2>
        <p>
          A slash chord like <strong>G/B</strong> means "G major chord with B in the bass."
          It's an inversion written out explicitly. Common uses:
        </p>
        <ul className="tt-learn-list">
          <li><strong>C/E</strong> = C major, first inversion (E in bass)</li>
          <li><strong>G/B</strong> = G major, first inversion (B in bass)</li>
          <li><strong>Am/C</strong> = A minor, first inversion (C in bass)</li>
          <li><strong>D/F♯</strong> = D major, first inversion — creates a smooth bass line from E → F♯ → G</li>
        </ul>
        <p className="tt-learn-tip">
          💡 If the note after the slash isn't one of the chord tones, it's a pedal tone —
          the bass holds a note while the chord changes above it. E.g., Cmaj7/G has G in the bass
          but G is already in the chord; D/C would be a true pedal (C is outside a D major triad).
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Alterations and additions</h2>
        <p>
          Complex jazz chords add alterations in parentheses: <strong>G7(♯9)</strong> = G dominant 7th
          with a raised 9th (the "Hendrix chord"). <strong>Cmaj7(♯11)</strong> = C major 7th with a
          raised 11th (Lydian flavour). Alterations are always enclosed in parentheses or follow
          immediately after the basic quality.
        </p>
        <p>
          The most common alterations on a V7 chord are: ♭9, ♯9, ♯11, ♭13.
          All four together (G7♭9♯9♯11♭13) spell out an entire altered scale.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function csGetAnswer(q: CSQuestion): string {
  if (q.questionType === 'name-from-symbol') return q.chord.name
  if (q.questionType === 'symbol-from-name') return q.chord.symbol || '(none)'
  return q.chord.intervals
}

function csGetDisplay(q: CSQuestion): string {
  if (q.questionType === 'name-from-symbol') return `C${q.chord.symbol}`
  if (q.questionType === 'symbol-from-name') return q.chord.name
  return `C${q.chord.symbol}`
}

function csGetPrompt(q: CSQuestion): string {
  if (q.questionType === 'name-from-symbol') return `What type of chord does the suffix "${q.chord.symbol || '(none)'}" indicate?`
  if (q.questionType === 'symbol-from-name') return `What suffix represents a ${q.chord.name.toLowerCase()}?`
  return `What intervals make up a ${q.chord.name.toLowerCase()}?`
}

const CS_MODE: QuizMode<CSQuestion>[] = [
  {
    id: 'mixed',
    label: 'Mixed',
    pool: CHORD_TYPES.map(c => csPick()),
    hint: 'No suffix = major · m = minor · 7 = dominant 7th · maj7 = major 7th · m7 = minor 7th',
  },
]

export function Quiz() {
  return (
    <TheoryQuiz<CSQuestion>
      modes={CS_MODE}
      pickQuestion={(_pool, excludeKey) => csPick(excludeKey)}
      getExcludeKey={(q) => q.chord.symbol}
      pickChoices={csChoices}
      getAnswer={csGetAnswer}
      renderQuestion={(q, _modeId, selected, answer) => (
        <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
          <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>{csGetDisplay(q)}</div>
          <div className="theory-q-sub">{csGetPrompt(q)}</div>
        </div>
      )}
    />
  )
}

export function ChordSymbols() {
  usePageTitle('Chord Symbols & Lead Sheets')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Chord Symbols &amp; Lead Sheets</h1>
        <p className="tt-page-sub">Read real-world notation: Cmaj7, G7♭9, Dm11 — the language of jazz charts, pop sheets, and gigging musicians.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🔣"
          title="Chord Symbols"
          description="Chord symbols are a compact shorthand for describing chords: Cmaj7, Dm7, G7, Fadd9. Used in lead sheets, jazz charts, and pop music everywhere. Once learned, a single symbol tells you exactly what to play."
          keyFact="A 'C' alone means C major triad. Adding '7' means dominant 7th (C-E-G-B♭). Adding 'maj7' means major 7th (C-E-G-B). The distinction matters enormously to a jazz musician."
          color="hsl(310, 55%, 48%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<Quiz />}
        topicName="chord symbols"
        gamesLabel="Practice"
      />
    </div>
  )
}
