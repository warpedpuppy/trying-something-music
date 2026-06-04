/**
 * Reharmonization — theory topic page.
 */
import { useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

interface ReharmTechnique {
  name: string
  description: string
  example: string
}

const TECHNIQUES: ReharmTechnique[] = [
  {
    name: 'Relative substitution',
    description: 'Replace a chord with another that shares most of its notes: I ↔ iii, IV ↔ ii, V ↔ vii°, I ↔ vi.',
    example: 'C → Am (share C–E–G vs A–C–E — two common tones)',
  },
  {
    name: 'Tritone substitution',
    description: 'Replace any V7 chord with the dominant 7th a tritone away. Both share the same tritone interval.',
    example: 'G7 → D♭7 (both contain B and F)',
  },
  {
    name: 'Secondary dominant insertion',
    description: 'Add a dominant 7th chord a 5th above any target chord to create a stronger approach.',
    example: 'Dm → A7–Dm (A7 is V/ii — adds pull)',
  },
  {
    name: 'Chord quality change',
    description: 'Change major to minor (or vice versa), or add/remove extensions to alter colour without changing function.',
    example: 'C → Cm (parallel minor colouring), G7 → Gmaj7 (remove tension)',
  },
  {
    name: 'Passing chord',
    description: 'Insert a chromatic or diatonic chord between two existing chords to create smoother voice leading.',
    example: 'C → F becomes C – Cm/E♭ – F (chromatic passing)',
  },
  {
    name: 'Pedal point',
    description: 'Hold a bass note (usually tonic or dominant) while chords change above it, creating tension and release.',
    example: 'Bass stays on G while chords move C – Dm – Em – C/E above it',
  },
  {
    name: 'Modal substitution',
    description: 'Replace a chord with the chord built on the same root but from a different mode — adds unexpected colour.',
    example: 'Cmaj7 → CΔ#11 (Lydian flavour), Am7 → Am7♭5 (half-diminished tinge)',
  },
  {
    name: 'Back-cycling',
    description: 'Add a ii–V before any target chord — and then another ii–V before that — creating a chain of preparations.',
    example: 'Cmaj7 ← G7 ← Dm7 ← A7 ← Em7 ← B7 (each ii–V prepares the next)',
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
    question: 'In C major, which chord is a relative substitution for I (Cmaj)?',
    answer: 'Em (iii)',
    choices: ['Em (iii)', 'Dm (ii)', 'G (V)', 'Bdim (vii°)'],
    explanation: 'I and iii share two common tones: C major = C–E–G, E minor = E–G–B. Two shared tones make them interchangeable in many contexts.',
  },
  {
    question: 'Which of these is a relative substitution for IV (Fmaj) in C major?',
    answer: 'Dm (ii)',
    choices: ['Dm (ii)', 'Am (vi)', 'Em (iii)', 'G (V)'],
    explanation: 'IV = F–A–C and ii = D–F–A share two notes (F and A), making ii a common substitute for IV.',
  },
  {
    question: 'A "back-cycling" reharmonization works by adding…',
    answer: 'A ii–V pair before the target chord',
    choices: [
      'A ii–V pair before the target chord',
      'A tritone substitution for every chord',
      'An augmented chord on the strong beat',
      'A borrowed chord from the parallel minor',
    ],
    explanation: 'Back-cycling prepares any target chord by adding its ii–V. Then you can continue back further, adding another ii–V before the ii. Creates long chains of dominant motion.',
  },
  {
    question: 'The key principle of reharmonization is that the melody note must be…',
    answer: 'Compatible with (or an extension of) the new chord',
    choices: [
      'Compatible with (or an extension of) the new chord',
      'The root of the new chord',
      'The 5th of the new chord',
      'Unaffected (the melody note is ignored)',
    ],
    explanation: 'When reharmonizing, you can change chords freely as long as the melody note works against the new chord — as a chord tone, a 9th, 11th, or 13th. A melody note that clashes with the new chord creates an unwanted dissonance.',
  },
  {
    question: 'A passing chord is typically used to…',
    answer: 'Create smooth chromatic bass or voice motion between two chords',
    choices: [
      'Create smooth chromatic bass or voice motion between two chords',
      'Replace the tonic chord with a dominant',
      'Change the time signature',
      'Add a sus4 before every resolution',
    ],
    explanation: 'Passing chords fill the gap between two diatonic chords with a chromatic (or diatonic) step, smoothing out the motion and adding harmonic interest.',
  },
  {
    question: 'In reharmonization, what does "chord quality change" mean?',
    answer: 'Changing a chord from major to minor (or adding/removing extensions) without changing its function',
    choices: [
      'Changing a chord from major to minor (or adding/removing extensions) without changing its function',
      'Moving the chord to a new root',
      'Replacing the chord with its tritone substitute',
      'Adding a pedal bass note',
    ],
    explanation: 'Changing chord quality is one of the simplest reharmonizations. G7 → Gmaj7 removes the tension. Am → A adds a "Picardy third" effect (major instead of minor).',
  },
  {
    question: 'Which common progression uses parallel substitution to add motion between I and IV?',
    answer: 'I – iii – IV (C – Em – F)',
    choices: [
      'I – iii – IV (C – Em – F)',
      'I – V – IV (C – G – F)',
      'I – ii – V (C – Dm – G)',
      'I – IV – V (C – F – G)',
    ],
    explanation: 'Using iii (Em) between I and IV is a classic reharmonization — Em is a relative substitution for I, so C → Em feels like a smooth variation before moving to F.',
  },
  {
    question: 'A pedal point creates tension by…',
    answer: 'Keeping a fixed bass note while changing harmonies above create dissonances',
    choices: [
      'Keeping a fixed bass note while changing harmonies above create dissonances',
      'Moving all voices in parallel motion',
      'Playing the same chord for four bars',
      'Using only whole-step bass motion',
    ],
    explanation: 'When the bass stays fixed while upper chords change, some of those chords will include notes that clash with the pedal tone — creating and releasing tension.',
  },
]

function pickQ(excludeQ?: string): ConceptQuestion {
  const pool = excludeQ ? CONCEPT_QUESTIONS.filter(q => q.question !== excludeQ) : CONCEPT_QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

type RHMode = 'techniques' | 'concepts'

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>The idea of reharmonization</h2>
        <p>
          <strong>Reharmonization</strong> means keeping the same melody but replacing the chords
          underneath. Because most melody notes can be heard as part of several different chords
          (as the root, 3rd, 5th, 7th, 9th, or even 11th), there's remarkable freedom in choosing
          which harmony supports a given note at any moment.
        </p>
        <p>
          Reharmonization is a fundamental jazz technique — arrangers constantly explore new harmonisations
          of standard melodies. But it's also present in classical music (Bach's four harmonisations of
          the same chorale melody), pop production, and film scoring.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Core techniques</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '160px 1fr' }}>
            <span>Technique</span><span>Example</span>
          </div>
          {TECHNIQUES.map(t => (
            <div key={t.name} className="tt-sig-row" style={{ gridTemplateColumns: '160px 1fr' }}>
              <span className="tt-sig-key" style={{ fontSize: '0.85rem' }}>{t.name}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.82rem' }}>{t.example}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>The constraint: the melody</h2>
        <p>
          The only hard rule of reharmonization is that the melody note must be compatible with
          the new chord. "Compatible" is generous — a melody note can be the root, 3rd, 5th, 7th,
          9th, 11th, or 13th of the chord. It can even be an altered extension (♭9, ♯9, ♯11, ♭13)
          if you want a tense, unresolved colour.
        </p>
        <p>
          What it cannot be is a non-chord tone that clashes without resolution — though even this
          is sometimes exploited for dramatic effect. The arranger's ear is the final judge.
        </p>
        <p className="tt-learn-tip">
          💡 Start simple: try replacing I with iii, or IV with ii, in a melody you know.
          Then add a ii–V before the tonic. Then try a tritone sub on the V7.
          Layer reharmonizations gradually — each one teaches you something new about the melody's
          harmonic possibilities.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Relative substitutions at a glance</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '80px 80px 1fr' }}>
            <span>Original</span><span>Sub</span><span>Shared notes</span>
          </div>
          {[
            { orig: 'I (C)',   sub: 'iii (Em)', shared: 'E, G' },
            { orig: 'I (C)',   sub: 'vi (Am)',  shared: 'C, E' },
            { orig: 'IV (F)',  sub: 'ii (Dm)',  shared: 'F, A' },
            { orig: 'V (G)',   sub: 'vii° (B°)', shared: 'B, D' },
          ].map(r => (
            <div key={r.orig} className="tt-sig-row" style={{ gridTemplateColumns: '80px 80px 1fr' }}>
              <span className="tt-sig-key" style={{ fontFamily: 'Georgia, serif' }}>{r.orig}</span>
              <span className="tt-sig-notes" style={{ fontFamily: 'Georgia, serif' }}>{r.sub}</span>
              <span className="tt-sig-notes">{r.shared}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function TechniqueCard({ t, active, onClick }: { t: ReharmTechnique; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`theory-card${active ? '' : ' theory-card-soon'}`}
      style={{ cursor: 'pointer', textAlign: 'left' }}
      onClick={onClick}
    >
      <div>
        <strong>{t.name}</strong>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#555' }}>{t.description}</p>
        {active && <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#3b6fe0' }}>{t.example}</p>}
      </div>
    </button>
  )
}

function Quiz() {
  const [mode, setMode] = useState<RHMode>('concepts')
  const [question, setQuestion] = useState<ConceptQuestion>(() => pickQ())
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [expandedTech, setExpandedTech] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  function advance(excludeQ: string) {
    const q = pickQ(excludeQ)
    setQuestion(q); setSelected(null)
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const correct = choice === question.answer
    setSelected(choice); setTotal(t => t + 1)
    if (correct) { setScore(s => s + 1); setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n }) }
    else setStreak(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (correct) timerRef.current = window.setTimeout(() => advance(question.question), 650)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  if (mode === 'techniques') {
    return (
      <div className="nq-root">
        <div className="nq-mode-row">
          <button type="button" className="nq-mode-btn" onClick={() => setMode('concepts')}>Concepts Quiz</button>
          <button type="button" className="nq-mode-btn active">Technique Browser</button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#6c7a8d', margin: '12px 0' }}>
          Tap any technique to see an example.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TECHNIQUES.map(t => (
            <TechniqueCard
              key={t.name}
              t={t}
              active={expandedTech === t.name}
              onClick={() => setExpandedTech(expandedTech === t.name ? null : t.name)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="nq-root">
      <div className="nq-mode-row">
        <button type="button" className="nq-mode-btn active">Concepts Quiz</button>
        <button type="button" className="nq-mode-btn" onClick={() => setMode('techniques')}>Technique Browser</button>
      </div>
      <div className="nq-score-row">
        <div className="nq-stat"><span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span><span className="nq-stat-label">correct</span></div>
        {accuracy !== null && <div className="nq-stat"><span className="nq-stat-value">{accuracy}%</span><span className="nq-stat-label">accuracy</span></div>}
        <div className="nq-stat"><span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span><span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span></div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected === question.answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        <div className="theory-q-sub" style={{ fontSize: '0.95rem', textAlign: 'center', padding: '0 8px' }}>{question.question}</div>
        {selected !== null && (
          <div className="theory-q-sub" style={{ marginTop: 10, fontSize: '0.85rem', color: '#555' }}>{question.explanation}</div>
        )}
      </div>

      <div className="nq-choices nq-choices--text">
        {question.choices.map(choice => {
          const isCorrect = choice === question.answer; const isSelected = choice === selected
          let cls = 'nq-choice'
          if (selected !== null) { if (isSelected && isCorrect) cls += ' nq-correct'; else if (isSelected) cls += ' nq-wrong'; else if (isCorrect) cls += ' nq-reveal' }
          return <button key={choice} type="button" className={cls} onClick={() => handleAnswer(choice)} disabled={selected !== null}>
            {cls.split(' ').includes('nq-reveal') ? (
              <>
                <span className="nq-reveal-top">correct answer</span>
                <span className="nq-reveal-val">{choice}</span>
              </>
            ) : choice}
          </button>
        })}
      </div>
      {selected !== null && selected !== question.answer && (
        <button
          type="button"
          className="nq-next-btn"
          onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); advance(question.question) }}
        >
          Next →
        </button>
      )}
      <p className="nq-hint">I ↔ iii/vi · IV ↔ ii · tritone sub on V7 · back-cycle = ii–V before target</p>
    </div>
  )
}

export function Reharmonization() {
  usePageTitle('Reharmonization')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Reharmonization</h1>
        <p className="tt-page-sub">Keep the melody — change the chords underneath. A creative technique that reveals how harmony and melody are independent dimensions.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="✨"
          title="Reharmonisation"
          description="Reharmonisation is substituting new, richer chords beneath an existing melody. Jazz musicians constantly reharmonise standards — replacing a simple I chord with a ii–V, or substituting a tritone substitute for a dominant chord."
          keyFact="The tritone substitution replaces G7 with D♭7 — they share the same tritone (B and F, just spelled differently) so the melody still works over the new chord."
          color="hsl(290, 60%, 48%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<Quiz />}
        topicName="reharmonization"
        gamesLabel="Practice"
      />
    </div>
  )
}
