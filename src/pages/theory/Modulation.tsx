/**
 * Modulation — theory topic page.
 */
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz, type QuizMode } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

interface PivotQuestion {
  fromKey: string
  toKey: string
  pivot: string      // chord name
  romanInFrom: string
  romanInTo: string
}

// A curated set of common pivot chord modulations
const PIVOT_QUESTIONS: PivotQuestion[] = [
  { fromKey: 'C major', toKey: 'G major', pivot: 'G',  romanInFrom: 'V',   romanInTo: 'I'   },
  { fromKey: 'C major', toKey: 'G major', pivot: 'Am', romanInFrom: 'vi',  romanInTo: 'ii'  },
  { fromKey: 'C major', toKey: 'F major', pivot: 'F',  romanInFrom: 'IV',  romanInTo: 'I'   },
  { fromKey: 'C major', toKey: 'F major', pivot: 'C',  romanInFrom: 'I',   romanInTo: 'V'   },
  { fromKey: 'C major', toKey: 'Am',      pivot: 'Am', romanInFrom: 'vi',  romanInTo: 'i'   },
  { fromKey: 'G major', toKey: 'D major', pivot: 'D',  romanInFrom: 'V',   romanInTo: 'I'   },
  { fromKey: 'G major', toKey: 'Em',      pivot: 'Em', romanInFrom: 'vi',  romanInTo: 'i'   },
  { fromKey: 'F major', toKey: 'C major', pivot: 'C',  romanInFrom: 'V',   romanInTo: 'I'   },
  { fromKey: 'D major', toKey: 'A major', pivot: 'A',  romanInFrom: 'V',   romanInTo: 'I'   },
  { fromKey: 'D major', toKey: 'Bm',      pivot: 'Bm', romanInFrom: 'vi',  romanInTo: 'i'   },
]

interface ModTypeQuestion {
  description: string
  answer: string
  choices: string[]
  explanation: string
}

const MOD_TYPE_QUESTIONS: ModTypeQuestion[] = [
  {
    description: 'A chord is shared between the current key and the new key. The music "lands" in the new key without any abrupt disruption.',
    answer: 'Common chord (pivot) modulation',
    choices: ['Common chord (pivot) modulation', 'Direct modulation', 'Chromatic modulation', 'Sequential modulation'],
    explanation: 'Pivot chord modulation is the smoothest type — the listener barely notices the key change because the shared chord feels natural in both keys.',
  },
  {
    description: 'The music abruptly jumps to a new key at a phrase boundary, with no common chord or preparation.',
    answer: 'Direct modulation',
    choices: ['Direct modulation', 'Common chord modulation', 'Enharmonic modulation', 'Sequential modulation'],
    explanation: 'Also called phrase modulation. Effective when you want a sudden, energizing key shift — common in pop and gospel (the "truck driver\'s modulation").',
  },
  {
    description: 'A single note or chord is reinterpreted as belonging to a new key through chromatic alteration.',
    answer: 'Chromatic modulation',
    choices: ['Chromatic modulation', 'Direct modulation', 'Pivot chord modulation', 'Deceptive modulation'],
    explanation: 'Chromatic modulations use a half-step move in one voice to pivot into a new tonal area. Common in Romantic-era music.',
  },
  {
    description: 'A melodic or harmonic pattern is transposed up or down repeatedly, landing in a new key.',
    answer: 'Sequential modulation',
    choices: ['Sequential modulation', 'Direct modulation', 'Pivot chord modulation', 'Chromatic modulation'],
    explanation: 'Sequences that rise or fall by step gradually shift the tonal center. "Circle of Fifths" sequences (I–IV–vii°–iii–vi–ii–V–I) are a classic example.',
  },
  {
    description: 'Two chords that share the same spelling in one key are reinterpreted as different chords in a new key (e.g. using G♯ = A♭).',
    answer: 'Enharmonic modulation',
    choices: ['Enharmonic modulation', 'Sequential modulation', 'Direct modulation', 'Chromatic modulation'],
    explanation: 'Enharmonic modulations exploit the fact that G♯ and A♭ sound identical on a piano. A dim7 chord (symmetrical) can be reinterpreted as belonging to 4 different keys.',
  },
  {
    description: 'This is the most dramatic, ear-catching type of modulation, commonly used in pop songs when the final chorus needs a lift.',
    answer: 'Direct modulation',
    choices: ['Direct modulation', 'Common chord modulation', 'Sequential modulation', 'Enharmonic modulation'],
    explanation: 'The "truck driver\'s gear change" (an abrupt up-by-a-step modulation) is a direct modulation — no preparation, maximum impact.',
  },
]

// Each PivotQuestion becomes two single-step questions (one per key role).
interface PivotStepQ {
  kind: 'pivot'
  fromKey: string
  toKey: string
  pivot: string
  step: 'from' | 'to'
  answer: string
}

interface ModTypeQ {
  kind: 'mod-type'
  modTypeQ: ModTypeQuestion
}

type ModQ = PivotStepQ | ModTypeQ

const PIVOT_POOL: PivotStepQ[] = PIVOT_QUESTIONS.flatMap(p => [
  { kind: 'pivot', fromKey: p.fromKey, toKey: p.toKey, pivot: p.pivot, step: 'from', answer: p.romanInFrom },
  { kind: 'pivot', fromKey: p.fromKey, toKey: p.toKey, pivot: p.pivot, step: 'to',   answer: p.romanInTo  },
])

const MOD_TYPE_POOL: ModTypeQ[] = MOD_TYPE_QUESTIONS.map(q => ({ kind: 'mod-type', modTypeQ: q }))

const FROM_ROMANS = [...new Set(PIVOT_QUESTIONS.map(p => p.romanInFrom))]
const TO_ROMANS   = [...new Set(PIVOT_QUESTIONS.map(p => p.romanInTo))]

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is modulation?</h2>
        <p>
          <strong>Modulation</strong> is when a piece of music shifts from one key center to another —
          not just borrowing a chord from another key, but actually <em>establishing</em> a new tonic.
          The music feels like it has moved house: the new key becomes the new "home."
        </p>
        <p>
          Modulation is one of the most powerful tools for creating contrast, building tension,
          and providing a sense of forward motion over long time spans. Without modulation, extended
          pieces would feel static and monotonous.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Types of modulation</h2>
        <ul className="tt-learn-list">
          <li>
            <strong>Common chord (pivot) modulation</strong> — the smoothest type. A chord
            that belongs to both the old and new key is reinterpreted, and the music seamlessly
            settles into the new key. The listener barely notices the seam.
          </li>
          <li>
            <strong>Direct (phrase) modulation</strong> — an abrupt jump to a new key at a
            phrase boundary. Energising and obvious — the classic "truck driver's gear change"
            (up a half or whole step for the final chorus) is always a direct modulation.
          </li>
          <li>
            <strong>Chromatic modulation</strong> — a chromatic inflection of one voice
            pivots the harmony into a new key. Subtle yet effective; common in Romantic-era music.
          </li>
          <li>
            <strong>Sequential modulation</strong> — a repeated pattern (sequence) gradually
            transports the music to a new key. Circle-of-fifths progressions often land in a
            new key without the listener realising it.
          </li>
          <li>
            <strong>Enharmonic modulation</strong> — notes that sound the same but are spelled
            differently (G♯ = A♭) allow a reinterpretation of a chord, pivoting into a distant key.
            Diminished 7th chords are the most common vehicle.
          </li>
        </ul>
      </section>

      <section className="tt-learn-section">
        <h2>Common pivot chord pairings</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
            <span>From</span><span>To</span><span>Pivot</span><span>Roles</span>
          </div>
          {PIVOT_QUESTIONS.slice(0, 6).map((p, i) => (
            <div key={i} className="tt-sig-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
              <span className="tt-sig-key">{p.fromKey}</span>
              <span className="tt-sig-notes">{p.toKey}</span>
              <span className="tt-sig-notes" style={{ fontFamily: 'Georgia, serif' }}>{p.pivot}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.82rem' }}>{p.romanInFrom} → {p.romanInTo}</span>
            </div>
          ))}
        </div>
        <p className="tt-learn-tip">
          💡 The most common modulations are to the dominant (up a 5th), the subdominant (up a 4th),
          and the relative major or minor. These keys share many chords, making pivot modulations easy to find.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>How to confirm a modulation</h2>
        <p>
          A modulation is confirmed (or "tonicised") by a <strong>V–I cadence in the new key</strong>.
          Until that cadence appears, you may just be hearing a borrowed chord or secondary dominant.
          The new tonic must be established — ideally with multiple chords from the new key — before
          we call it a true modulation.
        </p>
        <p>
          Composers often place a secondary dominant just before the new key's tonic to signal the
          arrival: the V/V – V – I pattern is a classic modulation-confirming gesture.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const MOD_MODES: QuizMode<ModQ>[] = [
  { id: 'pivot-chords', label: 'Pivot Chords',      pool: PIVOT_POOL,    hint: 'Pivot = same chord, two functions · Confirmed by V–I in new key' },
  { id: 'mod-types',    label: 'Modulation Types',  pool: MOD_TYPE_POOL },
]

function modPick(pool: ModQ[], excludeKey?: string): ModQ {
  const filtered = excludeKey ? pool.filter(q =>
    q.kind === 'pivot' ? q.fromKey !== excludeKey : q.modTypeQ.description !== excludeKey
  ) : pool
  const p = filtered.length > 0 ? filtered : pool
  return p[Math.floor(Math.random() * p.length)]
}

function modPickChoices(q: ModQ): string[] {
  if (q.kind === 'pivot') {
    const allRomans = q.step === 'from' ? FROM_ROMANS : TO_ROMANS
    const others = allRomans.filter(r => r !== q.answer).sort(() => Math.random() - 0.5).slice(0, 3)
    return [...others, q.answer].sort(() => Math.random() - 0.5)
  }
  return [...q.modTypeQ.choices].sort(() => Math.random() - 0.5)
}

export function ModQuiz() {
  return (
    <TheoryQuiz<ModQ>
      modes={MOD_MODES}
      pickQuestion={modPick}
      getExcludeKey={q => q.kind === 'pivot' ? q.fromKey : q.modTypeQ.description}
      pickChoices={modPickChoices}
      getAnswer={q => q.kind === 'pivot' ? q.answer : q.modTypeQ.answer}
      renderQuestion={(q, _modeId, selected, answer) => (
        <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
          {q.kind === 'pivot' ? (
            <>
              <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>{q.pivot}</div>
              <div className="theory-q-sub">
                {q.step === 'from'
                  ? <>This chord is the pivot between <strong>{q.fromKey}</strong> and <strong>{q.toKey}</strong>. What Roman numeral is it in <strong>{q.fromKey}</strong>?</>
                  : <>This chord is the pivot between <strong>{q.fromKey}</strong> and <strong>{q.toKey}</strong>. What Roman numeral is it in <strong>{q.toKey}</strong>?</>}
              </div>
            </>
          ) : (
            <>
              <div className="theory-q-sub" style={{ fontSize: '0.95rem', textAlign: 'center', padding: '0 8px' }}>{q.modTypeQ.description}</div>
              {selected !== null && (
                <div className="theory-q-sub" style={{ marginTop: 10, fontSize: '0.85rem', color: '#555' }}>{q.modTypeQ.explanation}</div>
              )}
            </>
          )}
        </div>
      )}
      choiceButtonStyle={{ fontFamily: 'Georgia, serif' }}
    />
  )
}

export function Modulation() {
  usePageTitle('Modulation')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Modulation</h1>
        <p className="tt-page-sub">Move from one key to another using pivot chords, direct shifts, or chromatic sleight-of-hand.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🚀"
          title="Modulation"
          description="Modulation is moving from one key to another within a piece of music. A well-placed modulation creates a sense of journey and arrival. The most common modulations are to the dominant (up a 5th) and the relative minor."
          keyFact="The 'truck driver modulation' — abruptly shifting up a half-step or whole step for the last chorus — is the most obvious form. Subtle modulations via pivot chords feel inevitable in hindsight."
          color="hsl(55, 75%, 38%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<ModQuiz />}
        topicName="modulation"
        gamesLabel="Practice"
      />
    </div>
  )
}
