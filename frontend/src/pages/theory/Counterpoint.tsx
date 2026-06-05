/**
 * Counterpoint — theory topic page.
 */
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz, type QuizMode } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'
import { BachPlayer } from '../../components/BachPlayer'

// ── Data ──────────────────────────────────────────────────────────────────────

interface SpeciesInfo {
  name: string
  ratio: string      // e.g. "1:1"
  description: string
  rule: string
}

const SPECIES: SpeciesInfo[] = [
  {
    name: 'First species',
    ratio: '1:1',
    description: 'One note in the counterpoint for each note in the cantus firmus (the given melody).',
    rule: 'Use only consonant intervals: unison, 3rd, 5th, 6th, 8th. Prefer contrary or oblique motion.',
  },
  {
    name: 'Second species',
    ratio: '2:1',
    description: 'Two notes in the counterpoint for each cantus firmus note.',
    rule: 'Strong beats must be consonant; weak beats may be passing tones. No parallel 5ths/8ths on strong beats.',
  },
  {
    name: 'Third species',
    ratio: '4:1',
    description: 'Four notes against each cantus firmus note (in 4/4 time).',
    rule: 'More passing tones and neighbor tones allowed. Dissonance can occur on weak beats when approached and left by step.',
  },
  {
    name: 'Fourth species',
    ratio: 'Suspensions',
    description: 'Notes are tied across bar lines, creating suspensions that resolve downward by step.',
    rule: 'A dissonance prepared on a weak beat, held across to a strong beat, then resolved down by step.',
  },
  {
    name: 'Fifth species',
    ratio: 'Free',
    description: 'Combines all previous species — the most expressive, essentially free counterpoint.',
    rule: 'All the rules of previous species apply depending on the rhythm used.',
  },
]

interface ConceptQuestion {
  question: string
  answer: string
  choices: string[]
  explanation: string
}

const CONCEPT_QUESTIONS: ConceptQuestion[] = [
  {
    question: 'Which interval is NOT considered consonant in strict counterpoint?',
    answer: 'Major 2nd',
    choices: ['Major 2nd', 'Major 3rd', 'Perfect 5th', 'Major 6th'],
    explanation: '2nds (and 7ths, and tritones) are dissonant. Consonances in counterpoint: unison, 3rd, 5th, 6th, octave.',
  },
  {
    question: 'Parallel 5ths and parallel octaves are forbidden in strict counterpoint because…',
    answer: 'They cause the voices to lose their independence',
    choices: [
      'They cause the voices to lose their independence',
      'They create too much dissonance',
      'They are too difficult to sing',
      'They do not follow the key signature',
    ],
    explanation: 'When two voices move in parallel 5ths or octaves, they fuse perceptually into one sound-stream, defeating the purpose of independent voice writing.',
  },
  {
    question: 'A suspension is a note that is…',
    answer: 'Held over from a consonance on a weak beat to become a dissonance on a strong beat, then resolved down by step',
    choices: [
      'Held over from a consonance on a weak beat to become a dissonance on a strong beat, then resolved down by step',
      'Played simultaneously with another note to create a chord',
      'A note from outside the scale used for colour',
      'A note that is repeated for rhythmic emphasis',
    ],
    explanation: 'Suspensions are the defining feature of fourth-species counterpoint. The "4–3 suspension" (holding a 4th and resolving to a 3rd) is the most common.',
  },
  {
    question: 'Which type of motion between two voices is most prized in counterpoint?',
    answer: 'Contrary motion',
    choices: ['Contrary motion', 'Parallel motion', 'Oblique motion', 'Similar motion'],
    explanation: 'Contrary motion — voices moving in opposite directions — maximizes independence and avoids accidental parallel perfect intervals.',
  },
  {
    question: 'In first-species counterpoint, the basic ratio of notes is…',
    answer: 'One note against one note',
    choices: ['One note against one note', 'Two notes against one', 'Four notes against one', 'Free rhythm'],
    explanation: 'First species is the strictest: each note of the counterpoint lines up exactly with each note of the cantus firmus.',
  },
  {
    question: 'A passing tone is a note that…',
    answer: 'Fills in a step between two consonant notes by step-wise motion',
    choices: [
      'Fills in a step between two consonant notes by step-wise motion',
      'Is approached by leap and left by step',
      'Is held over from the previous beat',
      'Doubles the bass an octave higher',
    ],
    explanation: 'Passing tones are dissonant connecting notes. They\'re approached AND left by step in the same direction, smoothing out the melodic line.',
  },
  {
    question: 'The "cantus firmus" in counterpoint exercises is…',
    answer: 'The given fixed melody that the student writes against',
    choices: [
      'The given fixed melody that the student writes against',
      'The bass line of a chord progression',
      'A repeating rhythmic pattern',
      'The harmonic reduction of the piece',
    ],
    explanation: '"Cantus firmus" means "fixed melody" in Latin. Students compose a counterpoint above (or below) this given melody according to the species rules.',
  },
  {
    question: 'Which type of motion should be AVOIDED between an outer voice and another voice when moving to a perfect interval?',
    answer: 'Similar motion (hidden 5ths/octaves)',
    choices: [
      'Similar motion (hidden 5ths/octaves)',
      'Contrary motion',
      'Oblique motion',
      'Stepwise motion',
    ],
    explanation: 'Similar motion to a perfect interval (5th or octave) creates "hidden parallels." These are especially avoided in outer voices — the soprano and bass must use contrary or oblique motion to reach perfect consonances.',
  },
]

function pickQ(excludeQ?: string): ConceptQuestion {
  const pool = excludeQ ? CONCEPT_QUESTIONS.filter(q => q.question !== excludeQ) : CONCEPT_QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is counterpoint?</h2>
        <p>
          <strong>Counterpoint</strong> is the art of combining two or more independent melodic lines
          so that they sound well together. Each line has its own rhythmic and melodic logic, yet they
          harmonise — creating texture, tension, and release through the interaction of their individual
          motions.
        </p>
        <p>
          The word comes from the Latin <em>punctus contra punctum</em> — "note against note."
          The study of counterpoint originates in Renaissance vocal polyphony and was systematised in
          the 18th century, most famously in the two-part inventions and fugues of J.S. Bach.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Species counterpoint</h2>
        <p>
          Johann Joseph Fux (1725) codified counterpoint teaching into five "species" — levels of
          increasing rhythmic complexity. Students write a counterpoint line against a given
          "cantus firmus" (fixed melody), applying progressively freer rules at each species.
        </p>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '130px 80px 1fr' }}>
            <span>Species</span><span>Ratio</span><span>Key feature</span>
          </div>
          {SPECIES.map(s => (
            <div key={s.name} className="tt-sig-row" style={{ gridTemplateColumns: '130px 80px 1fr' }}>
              <span className="tt-sig-key">{s.name}</span>
              <span className="tt-sig-notes">{s.ratio}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.85rem' }}>{s.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>The fundamental rules</h2>
        <ul className="tt-learn-list">
          <li><strong>Consonance on strong beats.</strong> The 3rd, 5th, 6th, and octave are consonant. 2nds, 4ths, 7ths, and tritones are dissonant and need resolution.</li>
          <li><strong>No parallel 5ths or octaves.</strong> The single most important rule — it destroys the independence of the voices.</li>
          <li><strong>Prefer contrary motion.</strong> Voices moving in opposite directions maintain independence and avoid accidental parallels.</li>
          <li><strong>Avoid voice crossing and overlapping.</strong> Keep each voice in its own register.</li>
          <li><strong>Dissonances must be prepared and resolved.</strong> A dissonant note should be approached smoothly (by step or held) and left by step.</li>
          <li><strong>Avoid large leaps.</strong> Especially in inner voices. Leaps should generally be followed by stepwise motion in the opposite direction.</li>
        </ul>
        <p className="tt-learn-tip">
          💡 The rules of counterpoint aren't arbitrary — they describe what happens when you ask multiple
          independent singers to improvise against a melody. The rules keep everything singable,
          independent, and harmonious all at once.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Hear it — Bach in two voices</h2>
        <p>
          Bach's <em>Two-Part Inventions</em> are the canonical study pieces for counterpoint.
          Each invention introduces a short motive in the right hand, which the left hand then
          imitates — creating two fully independent melodic lines that weave together.
          Listen for contrary motion, the imitation between voices, and how dissonances
          are always prepared and resolved.
        </p>
        <BachPlayer />
      </section>

      <section className="tt-learn-section">
        <h2>Why study counterpoint today?</h2>
        <p>
          Counterpoint training builds the ability to hear and write multiple simultaneous musical lines.
          It's the foundation of fugue, imitative polyphony, and complex orchestration. Even if you
          never write a fugue, the discipline of thinking in independent voices improves your
          arrangements, your harmonic awareness, and your ability to hear what's happening in complex music.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const COUNTERPOINT_MODE: QuizMode<ConceptQuestion>[] = [
  {
    id: 'concepts',
    label: 'Concepts',
    pool: CONCEPT_QUESTIONS,
    hint: 'No parallel 5ths/8ths · Contrary motion preferred · Dissonances must resolve · Consonances: 3rd, 5th, 6th, 8th',
  },
]

export function Quiz() {
  return (
    <TheoryQuiz<ConceptQuestion>
      modes={COUNTERPOINT_MODE}
      pickQuestion={(pool, excludeKey) => {
        const candidates = excludeKey ? pool.filter(q => q.question !== excludeKey) : pool
        return candidates[Math.floor(Math.random() * candidates.length)]
      }}
      getExcludeKey={(q) => q.question}
      pickChoices={(q) => [...q.choices].sort(() => Math.random() - 0.5)}
      getAnswer={(q) => q.answer}
      renderQuestion={(q, _modeId, selected, answer) => (
        <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
          <div className="theory-q-sub" style={{ fontSize: '0.95rem', textAlign: 'center', padding: '0 8px' }}>{q.question}</div>
          {selected !== null && (
            <div className="theory-q-sub" style={{ marginTop: 10, fontSize: '0.85rem', color: '#555' }}>{q.explanation}</div>
          )}
        </div>
      )}
      choicesClassName="nq-choices--text"
    />
  )
}

export function Counterpoint() {
  usePageTitle('Counterpoint')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Counterpoint</h1>
        <p className="tt-page-sub">Two or more independent melodic lines that work together — the foundation of Bach and the underlying logic of any great arrangement.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🎻"
          title="Counterpoint"
          description="Counterpoint is the art of combining two or more independent melodic lines so they sound beautiful together. Bach's fugues are the pinnacle of this craft — four voices that are each interesting alone but magnificent together."
          keyFact="The rule of contrary motion: when one voice goes up, the other goes down. This independence is what makes counterpoint sound rich rather than parallel."
          color="hsl(30, 70%, 42%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<Quiz />}
        topicName="counterpoint"
        gamesLabel="Practice"
      />
    </div>
  )
}
