/**
 * Tritone Substitution — theory topic page.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
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

function tsPick(excludeOriginal?: string): TSQuestion {
  const pool = excludeOriginal ? TRITONE_PAIRS.filter(p => p.original !== excludeOriginal) : TRITONE_PAIRS
  const pair = pool[Math.floor(Math.random() * pool.length)]
  const modes: TSMode[] = ['find-sub', 'find-original']
  const mode = modes[Math.floor(Math.random() * modes.length)]
  return { pair, mode }
}

function tsChoices(q: TSQuestion): string[] {
  const answer = q.mode === 'find-sub' ? q.pair.sub : q.pair.original
  const pool = TRITONE_PAIRS.map(p => q.mode === 'find-sub' ? p.sub : p.original)
  const others = [...new Set(pool.filter(v => v !== answer))].sort(() => Math.random() - 0.5).slice(0, 3)
  return [...others, answer].sort(() => Math.random() - 0.5)
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

function pickConceptQ(excludeQ?: string): ConceptQuestion {
  const pool = excludeQ ? CONCEPT_QUESTIONS.filter(q => q.question !== excludeQ) : CONCEPT_QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

type TSQuizMode = 'find-chord' | 'concepts'

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

function Quiz() {
  const [quizMode, setQuizMode] = useState<TSQuizMode>('find-chord')
  const [tsQ, setTsQ] = useState<TSQuestion>(() => tsPick())
  const [tsChoicesState, setTsChoicesState] = useState<string[]>(() => {
    const q = tsPick(); return tsChoices(q)
  })
  const [conceptQ, setConceptQ] = useState<ConceptQuestion>(() => pickConceptQ())
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const timerRef = useRef<number | null>(null)
  const modeRef = useRef<TSQuizMode>('find-chord')
  modeRef.current = quizMode

  const switchMode = useCallback((m: TSQuizMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    modeRef.current = m
    const q = tsPick(); const cq = pickConceptQ()
    setQuizMode(m); setTsQ(q); setTsChoicesState(tsChoices(q)); setConceptQ(cq)
    setSelected(null); setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance() {
    if (modeRef.current === 'find-chord') {
      const q = tsPick(tsQ.pair.original)
      setTsQ(q); setTsChoicesState(tsChoices(q)); setSelected(null)
    } else {
      const cq = pickConceptQ(conceptQ.question)
      setConceptQ(cq); setSelected(null)
    }
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = quizMode === 'find-chord'
      ? (tsQ.mode === 'find-sub' ? tsQ.pair.sub : tsQ.pair.original)
      : conceptQ.answer
    const correct = choice === answer
    setSelected(choice); setTotal(t => t + 1)
    if (correct) { setScore(s => s + 1); setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n }) }
    else setStreak(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(advance, correct ? 650 : 1500)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer = quizMode === 'find-chord'
    ? (tsQ.mode === 'find-sub' ? tsQ.pair.sub : tsQ.pair.original)
    : conceptQ.answer
  const currentChoices = quizMode === 'find-chord' ? tsChoicesState : conceptQ.choices
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  return (
    <div className="nq-root">
      <div className="nq-mode-row">
        <button type="button" className={`nq-mode-btn${quizMode === 'find-chord' ? ' active' : ''}`} onClick={() => switchMode('find-chord')}>Find the Sub</button>
        <button type="button" className={`nq-mode-btn${quizMode === 'concepts' ? ' active' : ''}`} onClick={() => switchMode('concepts')}>Concepts</button>
      </div>
      <div className="nq-score-row">
        <div className="nq-stat"><span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span><span className="nq-stat-label">correct</span></div>
        {accuracy !== null && <div className="nq-stat"><span className="nq-stat-value">{accuracy}%</span><span className="nq-stat-label">accuracy</span></div>}
        <div className="nq-stat"><span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span><span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span></div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        {quizMode === 'find-chord' ? (
          <>
            <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>
              {tsQ.mode === 'find-sub' ? tsQ.pair.original : tsQ.pair.sub}
            </div>
            <div className="theory-q-sub">
              {tsQ.mode === 'find-sub'
                ? <>What is the tritone substitution for <strong>{tsQ.pair.original}</strong>?</>
                : <>This chord is a tritone sub — what is the original V7?</>}
            </div>
          </>
        ) : (
          <>
            <div className="theory-q-sub" style={{ fontSize: '0.95rem', textAlign: 'center', padding: '0 8px' }}>{conceptQ.question}</div>
            {selected !== null && (
              <div className="theory-q-sub" style={{ marginTop: 10, fontSize: '0.85rem', color: '#555' }}>{conceptQ.explanation}</div>
            )}
          </>
        )}
      </div>

      <div className="nq-choices">
        {currentChoices.map(choice => {
          const isCorrect = choice === answer; const isSelected = choice === selected
          let cls = 'nq-choice'
          if (selected !== null) { if (isSelected && isCorrect) cls += ' nq-correct'; else if (isSelected) cls += ' nq-wrong'; else if (isCorrect) cls += ' nq-reveal' }
          return <button key={choice} type="button" className={cls} style={{ fontFamily: 'Georgia, serif' }} onClick={() => handleAnswer(choice)} disabled={selected !== null}>{choice}</button>
        })}
      </div>
      <p className="nq-hint">Tritone = 6 semitones · G7 ↔ D♭7 · same tritone, 3rd & 7th swap roles · bass moves by ½ step</p>
    </div>
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
      <TheoryTopicLayout learnContent={<LearnContent />} gamesContent={<Quiz />} topicName="tritone substitution" gamesLabel="Practice" />
    </div>
  )
}
