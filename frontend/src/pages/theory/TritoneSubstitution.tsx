/**
 * Tritone Substitution — theory topic page.
 */
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz, type QuizMode } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

interface TritoneSubPair {
  original: string    // e.g. "G7"
  sub: string         // e.g. "D♭7"
  sharedTritone: string  // e.g. "B ↔ F (= C♭)"
  key: string         // resolves to this key
}

const TRITONE_PAIRS: TritoneSubPair[] = [
  { original: 'G7',  sub: 'D♭7', sharedTritone: 'B ↔ F', key: 'C' },
  { original: 'D7',  sub: 'A♭7', sharedTritone: 'F♯ ↔ C', key: 'G' },
  { original: 'A7',  sub: 'E♭7', sharedTritone: 'C♯ ↔ G', key: 'D' },
  { original: 'E7',  sub: 'B♭7', sharedTritone: 'G♯ ↔ D', key: 'A' },
  { original: 'B7',  sub: 'F7',  sharedTritone: 'D♯ ↔ A', key: 'E' },
  { original: 'F♯7', sub: 'C7',  sharedTritone: 'A♯ ↔ E', key: 'B' },
  { original: 'C7',  sub: 'F♯7', sharedTritone: 'E ↔ B♭', key: 'F' },
  { original: 'F7',  sub: 'B7',  sharedTritone: 'A ↔ E♭', key: 'B♭' },
  { original: 'B♭7', sub: 'E7',  sharedTritone: 'D ↔ A♭', key: 'E♭' },
  { original: 'E♭7', sub: 'A7',  sharedTritone: 'G ↔ D♭', key: 'A♭' },
  { original: 'A♭7', sub: 'D7',  sharedTritone: 'C ↔ G♭', key: 'D♭' },
  { original: 'D♭7', sub: 'G7',  sharedTritone: 'F ↔ C♭', key: 'G♭' },
]

type TSMode = 'find-sub' | 'find-original'

interface TSQuestion {
  pair: TritoneSubPair
  mode: TSMode
}


interface ConceptQuestion {
  question: string
  answer: string
  choices: string[]
  explanation: string
}

const CONCEPT_QUESTIONS: ConceptQuestion[] = [
  {
    question: 'How far apart is a tritone substitution chord from the original?',
    answer: 'A tritone (6 semitones / ♭II)',
    choices: ['A tritone (6 semitones / ♭II)', 'A perfect 5th', 'A major 3rd', 'A minor 7th'],
    explanation: 'The substitution chord is exactly a tritone (augmented 4th / diminished 5th = 6 semitones) away from the original V7.',
  },
  {
    question: 'Why does a tritone substitution work so well?',
    answer: 'The two chords share the same tritone (3rd and 7th are swapped)',
    choices: [
      'The two chords share the same tritone (3rd and 7th are swapped)',
      'Both chords have the same root',
      'Both chords resolve to the same dominant',
      'They share a common 5th',
    ],
    explanation: 'G7 has B (3rd) and F (7th). D♭7 has F (3rd) and C♭/B (7th). The tritone B↔F is the same — just swapped between the 3rd and 7th roles.',
  },
  {
    question: 'What is the tritone substitution for G7 in C major?',
    answer: 'D♭7',
    choices: ['D♭7', 'F♯7', 'A♭7', 'B♭7'],
    explanation: 'D♭ is a tritone (6 semitones) above G. D♭7 shares the same tritone interval (B and F) as G7.',
  },
  {
    question: 'Tritone substitutions create a smooth bass line movement. G7→Cmaj becomes D♭7→C. The bass moves by…',
    answer: 'A half step downward',
    choices: ['A half step downward', 'A perfect 5th downward', 'A whole step upward', 'A tritone'],
    explanation: 'G→C = down a 5th (traditional). D♭→C = down a half step. The chromatic bass movement is one of the most prized features of tritone substitutions.',
  },
  {
    question: 'The chord a tritone away from C7 is…',
    answer: 'F♯7',
    choices: ['F♯7', 'G7', 'B♭7', 'E7'],
    explanation: 'C + 6 semitones = F♯. C7 and F♯7 share the tritone E↔B♭.',
  },
  {
    question: 'A tritone sub is most commonly applied to which chord type?',
    answer: 'Dominant 7th (V7)',
    choices: ['Dominant 7th (V7)', 'Major 7th', 'Minor 7th', 'Diminished 7th'],
    explanation: 'The tritone inside a dominant 7th chord is what gets swapped — it only works cleanly on dom 7th chords, which have both a 3rd and a ♭7th.',
  },
]

type TSQ =
  | { kind: 'find-chord'; tsQ: TSQuestion }
  | { kind: 'concept';    conceptQ: ConceptQuestion }

const FIND_CHORD_POOL: TSQ[] = TRITONE_PAIRS.flatMap(p => [
  { kind: 'find-chord', tsQ: { pair: p, mode: 'find-sub'      as TSMode } },
  { kind: 'find-chord', tsQ: { pair: p, mode: 'find-original' as TSMode } },
])
const CONCEPTS_POOL: TSQ[] = CONCEPT_QUESTIONS.map(q => ({ kind: 'concept', conceptQ: q }))

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>The elegance of the tritone</h2>
        <p>
          A <strong>tritone substitution</strong> replaces any dominant 7th chord with the dominant 7th
          chord built a tritone away — exactly 6 semitones (a ♭II relative to the resolution chord).
          In C major, you can replace <strong>G7</strong> with <strong>D♭7</strong>.
        </p>
        <p>
          The magic: G7 and D♭7 contain the <em>same tritone</em>, just with the roles of the 3rd
          and 7th swapped. G7 has B (major 3rd) and F (minor 7th). D♭7 has F (major 3rd) and C♭/B
          (minor 7th). The two notes that do all the harmonic work are identical.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>All 12 tritone substitution pairs</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '80px 80px 1fr 60px' }}>
            <span>V7</span><span>Sub (♭II7)</span><span>Shared tritone</span><span>Key</span>
          </div>
          {TRITONE_PAIRS.map(p => (
            <div key={p.original} className="tt-sig-row" style={{ gridTemplateColumns: '80px 80px 1fr 60px' }}>
              <span className="tt-sig-key" style={{ fontFamily: 'Georgia, serif' }}>{p.original}</span>
              <span className="tt-sig-notes" style={{ fontFamily: 'Georgia, serif' }}>{p.sub}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.82rem' }}>{p.sharedTritone}</span>
              <span className="tt-sig-notes">{p.key}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>The chromatic bass benefit</h2>
        <p>
          The most celebrated feature of tritone substitutions is the <strong>smooth chromatic bass line</strong>
          they create. Instead of the bass jumping down a 5th (G→C in a G7→C move), the bass steps down
          a half step (D♭→C). This single change transforms a conventional cadence into something
          much more sophisticated and jazz-idiomatic.
        </p>
        <p className="tt-learn-tip">
          💡 The progression ii – V – I in C (Dm7 – G7 – Cmaj7) becomes the classic jazz alteration:
          Dm7 – D♭7 – Cmaj7. The bass walks D → D♭ → C — a chromatic stepwise descent that sounds
          polished and inevitable.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Extended implications</h2>
        <p>
          When you substitute D♭7 for G7, the extensions and alterations of D♭7 become
          the altered tensions of G7. D♭7's 9th (E♭) is the ♭13th of G7. D♭7's ♭7th (C♭/B) is
          the ♭III of G7's root — the same note as G7's ♭9 raised by a tritone. This is why the
          altered scale (melodic minor from ♭II) works perfectly over an altered V7 chord.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const TS_HINT = 'Tritone = 6 semitones · G7 ↔ D♭7 · same tritone, 3rd & 7th swap roles · bass moves by ½ step'

const TS_MODES: QuizMode<TSQ>[] = [
  { id: 'find-chord', label: 'Find the Sub', pool: FIND_CHORD_POOL, hint: TS_HINT },
  { id: 'concepts',   label: 'Concepts',     pool: CONCEPTS_POOL,   hint: TS_HINT },
]

function tsPick(pool: TSQ[], excludeKey?: string): TSQ {
  const filtered = excludeKey ? pool.filter(q =>
    q.kind === 'find-chord' ? q.tsQ.pair.original !== excludeKey : q.conceptQ.question !== excludeKey
  ) : pool
  const p = filtered.length > 0 ? filtered : pool
  return p[Math.floor(Math.random() * p.length)]
}

function tsPickChoices(q: TSQ, _pool: TSQ[], _modeId: string): string[] {
  if (q.kind === 'find-chord') {
    const answer = q.tsQ.mode === 'find-sub' ? q.tsQ.pair.sub : q.tsQ.pair.original
    const vals = TRITONE_PAIRS.map(p => q.tsQ.mode === 'find-sub' ? p.sub : p.original)
    const others = [...new Set(vals.filter(v => v !== answer))].sort(() => Math.random() - 0.5).slice(0, 3)
    return [...others, answer].sort(() => Math.random() - 0.5)
  }
  return [...q.conceptQ.choices].sort(() => Math.random() - 0.5)
}

function tsGetAnswer(q: TSQ, _modeId: string): string {
  if (q.kind === 'find-chord') return q.tsQ.mode === 'find-sub' ? q.tsQ.pair.sub : q.tsQ.pair.original
  return q.conceptQ.answer
}

function TSQuiz() {
  return (
    <TheoryQuiz<TSQ>
      modes={TS_MODES}
      pickQuestion={tsPick}
      getExcludeKey={q => q.kind === 'find-chord' ? q.tsQ.pair.original : q.conceptQ.question}
      pickChoices={tsPickChoices}
      getAnswer={tsGetAnswer}
      renderQuestion={(q, _modeId, selected, answer) => (
        <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
          {q.kind === 'find-chord' ? (
            <>
              <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>
                {q.tsQ.mode === 'find-sub' ? q.tsQ.pair.original : q.tsQ.pair.sub}
              </div>
              <div className="theory-q-sub">
                {q.tsQ.mode === 'find-sub'
                  ? <>What is the tritone substitution for <strong>{q.tsQ.pair.original}</strong>?</>
                  : <>This chord is a tritone sub — what is the original V7?</>}
              </div>
            </>
          ) : (
            <>
              <div className="theory-q-sub" style={{ fontSize: '0.95rem', textAlign: 'center', padding: '0 8px' }}>{q.conceptQ.question}</div>
              {selected !== null && (
                <div className="theory-q-sub" style={{ marginTop: 10, fontSize: '0.85rem', color: '#555' }}>{q.conceptQ.explanation}</div>
              )}
            </>
          )}
        </div>
      )}
      choiceButtonStyle={{ fontFamily: 'Georgia, serif' }}
    />
  )
}

export function TritoneSubstitution() {
  usePageTitle('Tritone Substitution')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Tritone Substitution</h1>
        <p className="tt-page-sub">Replace any V7 chord with the chord a tritone away — one of the most elegant ideas in jazz harmony.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="↔️"
          title="Tritone Substitution"
          description="Any dominant 7th chord can be replaced by the dominant 7th a tritone away. G7 and D♭7 both contain the same tritone interval (B–F, just enharmonically respelled), so either can resolve to C."
          keyFact="Tritone subs are why jazz bass lines can move in half-steps instead of 5ths. Instead of G–C (down a 5th), the bass plays D♭–C (down a half-step) — smooth chromatic voice leading."
          color="hsl(0, 65%, 45%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<TSQuiz />}
        topicName="tritone substitution"
        gamesLabel="Practice"
      />
    </div>
  )
}
