/**
 * Scales & the Major Scale — theory topic page.
 *
 * Learn   — what a scale is, the W-W-H pattern, all 12 major scales
 * Practice — two modes: given root+degree → name the note; given root+note → name the degree
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

const MAJOR_SCALES: Record<string, string[]> = {
  'C':  ['C',  'D',  'E',  'F',  'G',  'A',  'B' ],
  'G':  ['G',  'A',  'B',  'C',  'D',  'E',  'F♯'],
  'D':  ['D',  'E',  'F♯', 'G',  'A',  'B',  'C♯'],
  'A':  ['A',  'B',  'C♯', 'D',  'E',  'F♯', 'G♯'],
  'E':  ['E',  'F♯', 'G♯', 'A',  'B',  'C♯', 'D♯'],
  'B':  ['B',  'C♯', 'D♯', 'E',  'F♯', 'G♯', 'A♯'],
  'F':  ['F',  'G',  'A',  'B♭', 'C',  'D',  'E' ],
  'B♭': ['B♭', 'C',  'D',  'E♭', 'F',  'G',  'A' ],
  'E♭': ['E♭', 'F',  'G',  'A♭', 'B♭', 'C',  'D' ],
  'A♭': ['A♭', 'B♭', 'C',  'D♭', 'E♭', 'F',  'G' ],
  'D♭': ['D♭', 'E♭', 'F',  'G♭', 'A♭', 'B♭', 'C' ],
  'G♭': ['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F' ],
}

const SCALE_KEYS   = Object.keys(MAJOR_SCALES)
const DEGREE_NAMES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th']

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function ScalesLearnContent() {
  const pattern = [
    { step: 'W',  label: 'Whole', from: 'C', to: 'D' },
    { step: 'W',  label: 'Whole', from: 'D', to: 'E' },
    { step: 'H',  label: 'Half',  from: 'E', to: 'F' },
    { step: 'W',  label: 'Whole', from: 'F', to: 'G' },
    { step: 'W',  label: 'Whole', from: 'G', to: 'A' },
    { step: 'W',  label: 'Whole', from: 'A', to: 'B' },
    { step: 'H',  label: 'Half',  from: 'B', to: 'C' },
  ]

  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a scale?</h2>
        <p>
          A <strong>scale</strong> is an ordered set of notes arranged by pitch, spanning
          one octave. Scales give music its character — the major scale sounds bright and
          settled; minor scales sound darker or more tense; exotic scales create
          unexpected moods.
        </p>
        <p>
          In Western music, the <strong>major scale</strong> is the single most important
          scale. Virtually everything in classical, pop, folk, and jazz is built from — or
          measured against — its structure.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The W–W–H–W–W–W–H pattern</h2>
        <p>
          Every major scale follows the same interval pattern between consecutive notes:
          <strong> Whole – Whole – Half – Whole – Whole – Whole – Half</strong>. This
          pattern is what makes all major scales sound the same, just starting on different
          pitches.
        </p>
        <div className="scales-pattern">
          {pattern.map((s, i) => (
            <div key={i} className="scales-step">
              <div className="scales-step-note">{s.from}</div>
              <div className={`scales-step-arrow${s.step === 'H' ? ' scales-half' : ''}`}>
                {s.step}
              </div>
              {i === pattern.length - 1 && (
                <div className="scales-step-note">{s.to}</div>
              )}
            </div>
          ))}
        </div>
        <p>
          The two half-steps fall between degrees 3–4 and 7–8. That gap between 7 and 8
          (called the <em>leading tone</em>) is what gives the major scale its satisfying
          pull back to the tonic.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Scale degrees</h2>
        <p>
          Each note in a scale has a numbered position called a <strong>scale degree</strong>.
          Degree 1 is the tonic (the home note). Degrees have names too:
        </p>
        <ul className="tt-learn-list">
          <li><strong>1 — Tonic.</strong> Home base. Music gravitates back to it.</li>
          <li><strong>2 — Supertonic.</strong> One step above.</li>
          <li><strong>3 — Mediant.</strong> Defines major vs minor quality.</li>
          <li><strong>4 — Subdominant.</strong> Creates tension away from tonic.</li>
          <li><strong>5 — Dominant.</strong> The second most important note after the tonic.</li>
          <li><strong>6 — Submediant.</strong> The root of the relative minor.</li>
          <li><strong>7 — Leading tone.</strong> One half-step below tonic; strongly pulls upward.</li>
        </ul>
      </section>

      <section className="tt-learn-section">
        <h2>All 12 major scales</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header">
            <span style={{ minWidth: 40 }}>Key</span>
            <span>1  2  3  4  5  6  7</span>
          </div>
          {SCALE_KEYS.map(key => (
            <div key={key} className="tt-sig-row">
              <span className="tt-sig-key" style={{ minWidth: 40 }}>{key}</span>
              <span className="tt-sig-notes" style={{ letterSpacing: '0.05em' }}>
                {MAJOR_SCALES[key].join('  ')}
              </span>
            </div>
          ))}
        </div>
        <p className="tt-learn-tip">
          💡 To build any major scale: start on the root, follow W–W–H–W–W–W–H, adding
          sharps or flats as needed to maintain the pattern. You don't need to memorise
          all 12 — knowing the pattern lets you derive them on the fly.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

type ScaleMode = 'degree-to-note' | 'note-to-degree'

interface ScaleQuestion {
  key: string
  degree: number   // 1-based (2-7 asked, 1 is trivially the root)
  note: string
}

function scalePickQuestion(exclude?: string): ScaleQuestion {
  const keys = exclude ? SCALE_KEYS.filter(k => k !== exclude) : SCALE_KEYS
  const key  = keys[Math.floor(Math.random() * keys.length)]
  const deg  = 1 + Math.floor(Math.random() * 7)  // 1–7
  return { key, degree: deg, note: MAJOR_SCALES[key][deg - 1] }
}

function scalePickChoices(mode: ScaleMode, q: ScaleQuestion): string[] {
  const scaleNotes = MAJOR_SCALES[q.key]
  if (mode === 'degree-to-note') {
    const answer = q.note
    const others = scaleNotes
      .filter(n => n !== answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    return [...others, answer].sort(() => Math.random() - 0.5)
  } else {
    const answer = String(q.degree)
    const others = ['1','2','3','4','5','6','7']
      .filter(d => d !== answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    return [...others, answer].sort(() => Math.random() - 0.5)
  }
}

function ScalesQuiz() {
  const [mode, setMode]         = useState<ScaleMode>('degree-to-note')
  const [question, setQuestion] = useState<ScaleQuestion>(() => scalePickQuestion())
  const [choices, setChoices]   = useState<string[]>(() => scalePickChoices('degree-to-note', question))
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore]       = useState(0)
  const [total, setTotal]       = useState(0)
  const [streak, setStreak]     = useState(0)
  const [best, setBest]         = useState(0)
  const timerRef  = useRef<number | null>(null)
  const modeRef   = useRef<ScaleMode>('degree-to-note')
  modeRef.current = mode

  const switchMode = useCallback((m: ScaleMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    modeRef.current = m
    const q = scalePickQuestion()
    setMode(m)
    setQuestion(q)
    setChoices(scalePickChoices(m, q))
    setSelected(null)
    setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance(fromKey: string) {
    const m = modeRef.current
    const q = scalePickQuestion(fromKey)
    setQuestion(q)
    setChoices(scalePickChoices(m, q))
    setSelected(null)
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = mode === 'degree-to-note' ? question.note : String(question.degree)
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
    timerRef.current = window.setTimeout(() => advance(question.key), correct ? 650 : 1200)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer   = mode === 'degree-to-note' ? question.note : String(question.degree)
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null
  const scaleDisplay = MAJOR_SCALES[question.key].map((n, i) => ({
    note: n, degree: i + 1, isTarget: i + 1 === question.degree,
  }))

  return (
    <div className="nq-root">

      <div className="nq-mode-row">
        <button type="button" className={`nq-mode-btn${mode === 'degree-to-note' ? ' active' : ''}`}
          onClick={() => switchMode('degree-to-note')}>Degree → Note</button>
        <button type="button" className={`nq-mode-btn${mode === 'note-to-degree' ? ' active' : ''}`}
          onClick={() => switchMode('note-to-degree')}>Note → Degree</button>
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
        {mode === 'degree-to-note' ? (
          <>
            <div className="theory-q-main">{DEGREE_NAMES[question.degree - 1]} degree</div>
            <div className="theory-q-sub">of <strong>{question.key} major</strong></div>
          </>
        ) : (
          <>
            <div className="theory-q-main">{question.note}</div>
            <div className="theory-q-sub">
              is the ___ degree of <strong>{question.key} major</strong>
            </div>
          </>
        )}
        {/* Mini scale strip */}
        <div className="scales-mini-strip">
          {scaleDisplay.map(({ note, degree, isTarget }) => (
            <div key={degree}
              className={`scales-mini-note${isTarget ? ' scales-mini-target' : ''}`}
              title={`Degree ${degree}`}>
              <span className="scales-mini-notename">{note}</span>
              <span className="scales-mini-deg">{degree}</span>
            </div>
          ))}
        </div>
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
              {mode === 'note-to-degree' ? DEGREE_NAMES[Number(choice) - 1] ?? choice : choice}
            </button>
          )
        })}
      </div>

      <p className="nq-hint">Pattern: W – W – H – W – W – W – H</p>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function ScalesAndMajorScale() {
  usePageTitle('Scales & the Major Scale')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Scales &amp; the Major Scale</h1>
        <p className="tt-page-sub">
          The W–W–H–W–W–W–H pattern that underlies all of Western harmony.
        </p>
      </div>
      <TheoryTopicLayout
        learnContent={<ScalesLearnContent />}
        gamesContent={<ScalesQuiz />}
        topicName="scales &amp; the major scale"
        gamesLabel="Practice"
      />
    </div>
  )
}
