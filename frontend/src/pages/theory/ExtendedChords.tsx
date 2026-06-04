/**
 * Extended & Altered Chords — theory topic page.
 */
import { useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

interface Extension {
  name: string          // "Major 9th"
  symbol: string        // "Cmaj9"
  degrees: string       // "1–3–5–7–9"
  noteNames: string     // "C–E–G–B–D" (built on C)
  description: string
}

const EXTENSIONS: Extension[] = [
  {
    name: 'Dominant 7th',
    symbol: 'C7',
    degrees: '1–3–5–♭7',
    noteNames: 'C–E–G–B♭',
    description: 'The foundation of all extended dominant chords. Contains a tritone (E↔B♭) that demands resolution.',
  },
  {
    name: 'Major 7th',
    symbol: 'Cmaj7',
    degrees: '1–3–5–7',
    noteNames: 'C–E–G–B',
    description: 'Soft, lush, "jazz major" quality. The tonic chord in jazz ballads and bossa nova.',
  },
  {
    name: 'Minor 7th',
    symbol: 'Cm7',
    degrees: '1–♭3–5–♭7',
    noteNames: 'C–E♭–G–B♭',
    description: 'The smooth ii chord. Backbone of ii–V–I progressions in jazz.',
  },
  {
    name: 'Dominant 9th',
    symbol: 'C9',
    degrees: '1–3–5–♭7–9',
    noteNames: 'C–E–G–B♭–D',
    description: 'A C7 with the 9th (= D) added. Fuller sound, common in funk and jazz.',
  },
  {
    name: 'Major 9th',
    symbol: 'Cmaj9',
    degrees: '1–3–5–7–9',
    noteNames: 'C–E–G–B–D',
    description: 'Lush, impressionistic. The hallmark chord of jazz-influenced pop and smooth jazz.',
  },
  {
    name: 'Minor 9th',
    symbol: 'Cm9',
    degrees: '1–♭3–5–♭7–9',
    noteNames: 'C–E♭–G–B♭–D',
    description: 'Silky minor colour. Common in neo-soul and late jazz harmony.',
  },
  {
    name: 'Dominant 11th',
    symbol: 'C11',
    degrees: '1–3–5–♭7–9–11',
    noteNames: 'C–E–G–B♭–D–F',
    description: 'The 11th (= F) clashes with the 3rd (E). Often voiced omitting the 3rd to avoid the clash.',
  },
  {
    name: 'Dominant 13th',
    symbol: 'C13',
    degrees: '1–3–5–♭7–9–(11)–13',
    noteNames: 'C–E–G–B♭–D–(F)–A',
    description: 'Theoretically 7 notes; in practice the 11th is often omitted. The richest dominant sound.',
  },
  {
    name: 'Altered dominant (7alt)',
    symbol: 'C7alt',
    degrees: '1–3–♭5 or ♯5–♭7–♭9 or ♯9',
    noteNames: 'C–E–G♭/G♯–B♭–D♭/D♯',
    description: 'Maximum tension. All tensions are altered (♭9, ♯9, ♯11, ♭13). Used on V7 before a strong resolution.',
  },
  {
    name: 'Dominant ♭9',
    symbol: 'C7♭9',
    degrees: '1–3–5–♭7–♭9',
    noteNames: 'C–E–G–B♭–D♭',
    description: 'Dark, diminished-tinged tension. Common on V7 in minor keys and in jazz harmony.',
  },
  {
    name: 'Dominant ♯9',
    symbol: 'C7♯9',
    degrees: '1–3–5–♭7–♯9',
    noteNames: 'C–E–G–B♭–D♯',
    description: 'The "Hendrix chord." The ♯9 sounds simultaneously major and minor, creating a bluesy clash.',
  },
  {
    name: 'Lydian dominant (7♯11)',
    symbol: 'C7♯11',
    degrees: '1–3–5–♭7–♯11',
    noteNames: 'C–E–G–B♭–F♯',
    description: 'The Lydian dominant sound — simultaneously bright (♯11) and bluesy (♭7). Common in jazz and film.',
  },
]

interface ECQuestion {
  ext: Extension
  type: 'symbol-to-degrees' | 'name-to-symbol' | 'degrees-to-name'
}

function ecPick(excludeSymbol?: string): ECQuestion {
  const pool = excludeSymbol ? EXTENSIONS.filter(e => e.symbol !== excludeSymbol) : EXTENSIONS
  const ext = pool[Math.floor(Math.random() * pool.length)]
  const types: ECQuestion['type'][] = ['symbol-to-degrees', 'name-to-symbol', 'degrees-to-name']
  const type = types[Math.floor(Math.random() * types.length)]
  return { ext, type }
}

function ecChoices(q: ECQuestion): string[] {
  let answer: string
  let pool: string[]

  if (q.type === 'symbol-to-degrees') {
    answer = q.ext.degrees
    pool = EXTENSIONS.map(e => e.degrees)
  } else if (q.type === 'name-to-symbol') {
    answer = q.ext.symbol
    pool = EXTENSIONS.map(e => e.symbol)
  } else {
    answer = q.ext.name
    pool = EXTENSIONS.map(e => e.name)
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
        <h2>Beyond the triad</h2>
        <p>
          Triads (root–3rd–5th) and 7th chords are the grammar of common practice music.
          <strong> Extended chords</strong> go further — adding the 9th, 11th, and 13th above the root.
          These intervals are the 2nd, 4th, and 6th transposed up an octave, and they layer
          additional colour and tension onto an already complex harmonic structure.
        </p>
        <p>
          Extended chords are the hallmark of jazz, soul, funk, neo-soul, and film scoring.
          They're also why a pianist playing a jazz chord can use all 10 fingers and still leave
          out notes — a full 13th chord contains 7 different pitches.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The extension ladder</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '80px 90px 1fr' }}>
            <span>Symbol</span><span>Degrees</span><span>Notes (on C)</span>
          </div>
          {EXTENSIONS.slice(0, 8).map(e => (
            <div key={e.symbol} className="tt-sig-row" style={{ gridTemplateColumns: '80px 90px 1fr' }}>
              <span className="tt-sig-key" style={{ fontFamily: 'Georgia, serif' }}>{e.symbol}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.82rem' }}>{e.degrees}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.82rem' }}>{e.noteNames}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>Altered tensions</h2>
        <p>
          On a dominant 7th chord (V7), any of the natural extensions can be raised or lowered
          a half step. These are called <strong>alterations</strong> and they increase the tension,
          making the chord even more desperate to resolve:
        </p>
        <ul className="tt-learn-list">
          <li><strong>♭9</strong> — one half step above the root. Dark, diminished quality.</li>
          <li><strong>♯9</strong> — the "Hendrix chord" extension. Sounds simultaneously major and minor.</li>
          <li><strong>♯11</strong> — the Lydian dominant. Bright and floating above the ♭7 tension below.</li>
          <li><strong>♭13</strong> — raises the tension to near-dissonance; often implies an augmented 5th.</li>
        </ul>
        <p className="tt-learn-tip">
          💡 Altered chords (all tensions altered) are written "7alt" and spell out the altered scale —
          one of the most important jazz scales, built by playing melodic minor starting from a half step
          above the root.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Voicing extended chords</h2>
        <p>
          In practice, extended chords are rarely voiced with all their notes. The 5th is almost
          always omitted (it contributes little colour). The 3rd and 7th are kept — they define
          the chord quality. Extensions and alterations are chosen for colour and voice leading.
        </p>
        <p>
          A jazz pianist playing Cmaj9 might voice it: E (3rd) – B (7th) – D (9th) in the right hand,
          with C in the bass — three notes that capture the full sound of the chord without crowding.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function Quiz() {
  const [question, setQuestion] = useState<ECQuestion>(() => ecPick())
  const [choices, setChoices] = useState<string[]>(() => ecChoices(ecPick()))
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const timerRef = useRef<number | null>(null)

  function advance(excludeSymbol: string) {
    const q = ecPick(excludeSymbol)
    setQuestion(q); setChoices(ecChoices(q)); setSelected(null)
  }

  function getAnswer(q: ECQuestion): string {
    if (q.type === 'symbol-to-degrees') return q.ext.degrees
    if (q.type === 'name-to-symbol') return q.ext.symbol
    return q.ext.name
  }

  function getPrompt(q: ECQuestion): string {
    if (q.type === 'symbol-to-degrees') return `What scale degrees make up a ${q.ext.symbol} chord?`
    if (q.type === 'name-to-symbol') return `What is the chord symbol for a ${q.ext.name.toLowerCase()}?`
    return `"${q.ext.description.split('.')[0]}." Which chord type is this?`
  }

  function getDisplay(q: ECQuestion): string {
    if (q.type === 'symbol-to-degrees') return q.ext.symbol
    if (q.type === 'name-to-symbol') return q.ext.name
    return q.ext.symbol
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = getAnswer(question)
    const correct = choice === answer
    setSelected(choice); setTotal(t => t + 1)
    if (correct) { setScore(s => s + 1); setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n }) }
    else setStreak(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (correct) timerRef.current = window.setTimeout(() => advance(question.ext.symbol), 650)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer = getAnswer(question)
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  return (
    <div className="nq-root ec-quiz">
      <div className="nq-score-row">
        <div className="nq-stat"><span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span><span className="nq-stat-label">correct</span></div>
        {accuracy !== null && <div className="nq-stat"><span className="nq-stat-value">{accuracy}%</span><span className="nq-stat-label">accuracy</span></div>}
        <div className="nq-stat"><span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span><span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span></div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>{getDisplay(question)}</div>
        <div className="theory-q-sub">{getPrompt(question)}</div>
      </div>

      <div className="nq-choices">
        {choices.map(choice => {
          const isCorrect = choice === answer; const isSelected = choice === selected
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
      {selected !== null && selected !== answer && (
        <button
          type="button"
          className="nq-next-btn"
          onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); advance(question.ext.symbol) }}
        >
          Next →
        </button>
      )}
      <p className="nq-hint">7 = dom 7th · maj7 = major 7th · m7 = minor 7th · 9 adds 9th · ♭9/♯9/♯11 = alterations</p>
    </div>
  )
}

export function ExtendedChords() {
  usePageTitle('Extended & Altered Chords')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Extended &amp; Altered Chords</h1>
        <p className="tt-page-sub">Add 9ths, 11ths, 13ths, and alterations to build the lush, complex harmonies of jazz and film music.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🎷"
          title="Extended & Altered Chords"
          description="Extended chords stack additional thirds beyond the 7th: 9ths, 11ths, 13ths. Altered chords raise or lower these extensions for maximum tension. These are the sounds of jazz harmony."
          keyFact="A dominant 7th chord (G7) has one tritone. A G7♯11 has two overlapping tritones — producing the heightened tension that makes jazz resolutions so satisfying."
          color="hsl(40, 75%, 42%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<Quiz />}
        topicName="extended chords"
        gamesLabel="Practice"
      />
    </div>
  )
}
