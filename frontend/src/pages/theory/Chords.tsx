/**
 * Triads & Basic Chords — theory topic page.
 *
 * Learn   — what a triad is; major, minor, diminished, augmented qualities;
 *           interval stacks; how to build any triad
 * Practice — two modes: identify quality from three notes; identify the third note
 *            from root + quality
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

type ChordQuality = 'Major' | 'Minor' | 'Diminished' | 'Augmented'

interface Triad {
  root: string
  quality: ChordQuality
  notes: [string, string, string]   // [root, third, fifth]
}

const TRIADS: Triad[] = [
  // Major
  { root: 'C',  quality: 'Major',      notes: ['C',  'E',  'G' ] },
  { root: 'G',  quality: 'Major',      notes: ['G',  'B',  'D' ] },
  { root: 'D',  quality: 'Major',      notes: ['D',  'F♯', 'A' ] },
  { root: 'A',  quality: 'Major',      notes: ['A',  'C♯', 'E' ] },
  { root: 'E',  quality: 'Major',      notes: ['E',  'G♯', 'B' ] },
  { root: 'F',  quality: 'Major',      notes: ['F',  'A',  'C' ] },
  { root: 'B♭', quality: 'Major',      notes: ['B♭', 'D',  'F' ] },
  { root: 'E♭', quality: 'Major',      notes: ['E♭', 'G',  'B♭'] },
  { root: 'A♭', quality: 'Major',      notes: ['A♭', 'C',  'E♭'] },
  // Minor
  { root: 'A',  quality: 'Minor',      notes: ['A',  'C',  'E' ] },
  { root: 'E',  quality: 'Minor',      notes: ['E',  'G',  'B' ] },
  { root: 'D',  quality: 'Minor',      notes: ['D',  'F',  'A' ] },
  { root: 'B',  quality: 'Minor',      notes: ['B',  'D',  'F♯'] },
  { root: 'G',  quality: 'Minor',      notes: ['G',  'B♭', 'D' ] },
  { root: 'C',  quality: 'Minor',      notes: ['C',  'E♭', 'G' ] },
  { root: 'F',  quality: 'Minor',      notes: ['F',  'A♭', 'C' ] },
  { root: 'F♯', quality: 'Minor',      notes: ['F♯', 'A',  'C♯'] },
  // Diminished
  { root: 'B',  quality: 'Diminished', notes: ['B',  'D',  'F' ] },
  { root: 'C♯', quality: 'Diminished', notes: ['C♯', 'E',  'G' ] },
  { root: 'F♯', quality: 'Diminished', notes: ['F♯', 'A',  'C' ] },
  { root: 'G♯', quality: 'Diminished', notes: ['G♯', 'B',  'D' ] },
  // Augmented
  { root: 'C',  quality: 'Augmented',  notes: ['C',  'E',  'G♯'] },
  { root: 'G',  quality: 'Augmented',  notes: ['G',  'B',  'D♯'] },
  { root: 'F',  quality: 'Augmented',  notes: ['F',  'A',  'C♯'] },
  { root: 'D',  quality: 'Augmented',  notes: ['D',  'F♯', 'A♯'] },
]

const QUALITIES: ChordQuality[] = ['Major', 'Minor', 'Diminished', 'Augmented']

// ── Quality descriptions for display ──────────────────────────────────────────

const QUALITY_INFO: Record<ChordQuality, { interval: string; emoji: string }> = {
  Major:      { interval: 'M3 + m3 (4 + 3 semitones)', emoji: '☀️' },
  Minor:      { interval: 'm3 + M3 (3 + 4 semitones)', emoji: '🌙' },
  Diminished: { interval: 'm3 + m3 (3 + 3 semitones)', emoji: '🔻' },
  Augmented:  { interval: 'M3 + M3 (4 + 4 semitones)', emoji: '⬆️' },
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function ChordsLearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a triad?</h2>
        <p>
          A <strong>triad</strong> is the simplest type of chord: three notes stacked by
          <strong> thirds</strong> (every other letter of the scale). The three notes are called
          the <strong>root</strong> (bottom), the <strong>third</strong> (middle), and the
          <strong> fifth</strong> (top). Stack C–E–G and you have a C major triad.
        </p>
        <p>
          The interval between the root and the third — and between the third and the fifth —
          determines the chord's <strong>quality</strong>. There are four qualities you'll
          encounter constantly: major, minor, diminished, and augmented.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The four triad qualities</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header">
            <span>Quality</span><span>Intervals</span><span>Sound</span>
          </div>
          {QUALITIES.map(q => (
            <div key={q} className="tt-sig-row">
              <span className="tt-sig-key">{q}</span>
              <span className="tt-sig-notes">{QUALITY_INFO[q].interval}</span>
              <span>{QUALITY_INFO[q].emoji}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 14 }}>
          Notice the pattern: major and minor swap which third comes first.
          Diminished stacks two minor thirds; augmented stacks two major thirds.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Building any triad</h2>
        <ul className="tt-learn-list">
          <li>
            <strong>Major:</strong> root → up a major 3rd (4 semitones) → up a minor 3rd
            (3 more). Example: C + E + G.
          </li>
          <li>
            <strong>Minor:</strong> root → up a minor 3rd (3 semitones) → up a major 3rd
            (4 more). Example: A + C + E.
          </li>
          <li>
            <strong>Diminished:</strong> root → up a minor 3rd → up another minor 3rd.
            Example: B + D + F.
          </li>
          <li>
            <strong>Augmented:</strong> root → up a major 3rd → up another major 3rd.
            Example: C + E + G♯.
          </li>
        </ul>
        <p className="tt-learn-tip">
          💡 In any major scale, the triads built on the 7 scale degrees always follow the
          same quality pattern: Major – minor – minor – Major – Major – minor – diminished.
          Memorise this as I–ii–iii–IV–V–vi–vii° and you know every diatonic chord
          in every key.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Chord symbols</h2>
        <p>
          In sheet music and lead sheets, chord qualities are notated with symbols after the
          root note:
        </p>
        <ul className="tt-learn-list">
          <li><strong>Major:</strong> just the letter — C, G, F</li>
          <li><strong>Minor:</strong> lowercase "m" — Am, Em, Dm</li>
          <li><strong>Diminished:</strong> degree symbol — B°, C♯°</li>
          <li><strong>Augmented:</strong> plus sign — C+, G+</li>
        </ul>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

type ChordMode = 'notes-to-quality' | 'quality-to-third'

function chordPickQuestion(exclude?: string): Triad {
  // Avoid same root+quality combo
  const pool = exclude
    ? TRIADS.filter(t => `${t.root}${t.quality}` !== exclude)
    : TRIADS
  return pool[Math.floor(Math.random() * pool.length)]
}

function chordPickChoices(mode: ChordMode, correct: Triad): string[] {
  if (mode === 'notes-to-quality') {
    const answer = correct.quality
    const others = QUALITIES.filter(q => q !== answer)
      .sort(() => Math.random() - 0.5).slice(0, 3)
    return [...others, answer].sort(() => Math.random() - 0.5)
  } else {
    // quality-to-third: pick the correct third note; distractors are other thirds from pool
    const answer = correct.notes[1]
    const others = TRIADS
      .filter(t => t.notes[1] !== answer)
      .map(t => t.notes[1])
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    return [...others, answer].sort(() => Math.random() - 0.5)
  }
}

function ChordsQuiz() {
  const [mode, setMode]         = useState<ChordMode>('notes-to-quality')
  const [question, setQuestion] = useState<Triad>(() => chordPickQuestion())
  const [choices, setChoices]   = useState<string[]>(() => chordPickChoices('notes-to-quality', question))
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore]       = useState(0)
  const [total, setTotal]       = useState(0)
  const [streak, setStreak]     = useState(0)
  const [best, setBest]         = useState(0)
  const timerRef  = useRef<number | null>(null)
  const modeRef   = useRef<ChordMode>('notes-to-quality')
  modeRef.current = mode

  const switchMode = useCallback((m: ChordMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    modeRef.current = m
    const q = chordPickQuestion()
    setMode(m)
    setQuestion(q)
    setChoices(chordPickChoices(m, q))
    setSelected(null)
    setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance(fromId: string) {
    const m = modeRef.current
    const q = chordPickQuestion(fromId)
    setQuestion(q)
    setChoices(chordPickChoices(m, q))
    setSelected(null)
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = mode === 'notes-to-quality' ? question.quality : question.notes[1]
    const correct = choice === answer
    setSelected(choice)
    setTotal(t => t + 1)
    if (correct) {
      setScore(s => s + 1)
      setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n })
    } else {
      setStreak(0)
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    if (correct) timerRef.current = window.setTimeout(() => advance(`${question.root}${question.quality}`), 650)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer   = mode === 'notes-to-quality' ? question.quality : question.notes[1]
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  return (
    <div className="nq-root">

      <div className="nq-mode-row">
        <button type="button" className={`nq-mode-btn${mode === 'notes-to-quality' ? ' active' : ''}`}
          onClick={() => switchMode('notes-to-quality')}>Notes → Quality</button>
        <button type="button" className={`nq-mode-btn${mode === 'quality-to-third' ? ' active' : ''}`}
          onClick={() => switchMode('quality-to-third')}>Quality → Third</button>
      </div>

      <div className="nq-score-row">
        <div className="nq-stat">
          <span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span>
          <span className="nq-stat-label">correct</span>
        </div>
        {accuracy !== null && (
          <div className="nq-stat">
            <span className="nq-stat-value">{accuracy}%</span>
            <span className="nq-stat-label">accuracy</span>
          </div>
        )}
        <div className="nq-stat">
          <span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span>
          <span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span>
        </div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        {mode === 'notes-to-quality' ? (
          <>
            {/* Three stacked notes */}
            <div className="theory-q-chord">
              {question.notes.map((note, i) => (
                <div key={i} className="theory-q-note">
                  <div className="theory-q-note-name">{note}</div>
                  <div className="theory-q-note-role">
                    {['Root', '3rd', '5th'][i]}
                  </div>
                </div>
              ))}
            </div>
            <div className="theory-q-sub" style={{ marginTop: 12 }}>What quality is this triad?</div>
          </>
        ) : (
          <>
            <div className="theory-q-main">{question.root} {question.quality}</div>
            <div className="theory-q-sub">
              Root: <strong>{question.notes[0]}</strong> — what is the third?
            </div>
          </>
        )}
      </div>

      <div className="nq-choices">
        {choices.map(choice => {
          const isCorrect  = choice === answer
          const isSelected = choice === selected
          let cls = 'nq-choice'
          if (selected !== null) {
            if (isSelected && isCorrect)  cls += ' nq-correct'
            else if (isSelected)          cls += ' nq-wrong'
            else if (isCorrect)           cls += ' nq-reveal'
          }
          return (
            <button key={choice} type="button" className={cls}
              onClick={() => handleAnswer(choice)} disabled={selected !== null}>
              {cls.split(' ').includes('nq-reveal') ? (
                <>
                  <span className="nq-reveal-top">correct answer</span>
                  <span className="nq-reveal-val">{choice}</span>
                </>
              ) : choice}
            </button>
          )
        })}
      </div>
      {selected !== null && selected !== answer && (
        <button
          type="button"
          className="nq-next-btn"
          onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); advance(`${question.root}${question.quality}`) }}
        >
          Next →
        </button>
      )}

      <p className="nq-hint">
        Major: M3+m3 · Minor: m3+M3 · Dim: m3+m3 · Aug: M3+M3
      </p>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function TriadsAndChords() {
  usePageTitle('Triads & Basic Chords')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Triads &amp; Basic Chords</h1>
        <p className="tt-page-sub">
          Stack three notes a third apart — and you get the atom of harmony.
        </p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🎹"
          title="Chords"
          description="A chord is three or more notes played together. Stack notes a 3rd apart from any scale and you get the chords of that key — the harmonic vocabulary of western music."
          keyFact="The I, IV, and V chords alone can harmonise most folk, pop, and rock songs ever written."
          color="hsl(200, 70%, 45%)"
        />}
        learnContent={<ChordsLearnContent />}
        gamesContent={<ChordsQuiz />}
        topicName="triads &amp; basic chords"
        gamesLabel="Practice"
      />
    </div>
  )
}
