/**
 * The 12-Bar Blues — theory topic page.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

// Standard 12-bar blues bar structure (1-indexed)
const BLUES_FORM: Array<{ bar: number; chord: 'I7' | 'IV7' | 'V7' }> = [
  { bar: 1,  chord: 'I7'  },
  { bar: 2,  chord: 'I7'  },
  { bar: 3,  chord: 'I7'  },
  { bar: 4,  chord: 'I7'  },
  { bar: 5,  chord: 'IV7' },
  { bar: 6,  chord: 'IV7' },
  { bar: 7,  chord: 'I7'  },
  { bar: 8,  chord: 'I7'  },
  { bar: 9,  chord: 'V7'  },
  { bar: 10, chord: 'IV7' },
  { bar: 11, chord: 'I7'  },
  { bar: 12, chord: 'V7'  },
]

// Chord names in each key for quiz display
const CHORD_NAMES: Record<string, Record<'I7' | 'IV7' | 'V7', string>> = {
  G: { I7: 'G7', IV7: 'C7', V7: 'D7' },
  A: { I7: 'A7', IV7: 'D7', V7: 'E7' },
  E: { I7: 'E7', IV7: 'A7', V7: 'B7' },
  C: { I7: 'C7', IV7: 'F7', V7: 'G7' },
  'B♭': { I7: 'B♭7', IV7: 'E♭7', V7: 'F7' },
  F: { I7: 'F7', IV7: 'B♭7', V7: 'C7' },
}
const QUIZ_KEYS = Object.keys(CHORD_NAMES)
const ROMAN_OPTIONS: Array<'I7' | 'IV7' | 'V7'> = ['I7', 'IV7', 'V7']

interface BluesQuestion {
  key: string
  bar: number
  answer: 'I7' | 'IV7' | 'V7'
}

function bPick(excludeBar?: number): BluesQuestion {
  const key = QUIZ_KEYS[Math.floor(Math.random() * QUIZ_KEYS.length)]
  const pool = excludeBar ? BLUES_FORM.filter(b => b.bar !== excludeBar) : BLUES_FORM
  const barEntry = pool[Math.floor(Math.random() * pool.length)]
  return { key, bar: barEntry.bar, answer: barEntry.chord }
}

type BluesMode = 'bar-to-roman' | 'bar-to-chord'

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>The structure everyone knows</h2>
        <p>
          The <strong>12-bar blues</strong> is arguably the most important musical form in popular music.
          It's the foundation of the blues, rock and roll, jazz, and countless pop songs — a repeating
          12-measure pattern built from just three chords: <strong>I7, IV7, and V7</strong>.
        </p>
        <p>
          All three chords are <em>dominant 7th</em> chords — which in traditional tonal theory would
          suggest they're all pulling toward a resolution that never fully arrives. That harmonic restlessness
          <em>is</em> the blues feeling.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The 12-bar form</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '60px 80px 1fr' }}>
            <span>Bar</span><span>Chord</span><span>In G blues</span>
          </div>
          {BLUES_FORM.map(({ bar, chord }) => (
            <div key={bar} className="tt-sig-row" style={{ gridTemplateColumns: '60px 80px 1fr' }}>
              <span className="tt-sig-key">Bar {bar}</span>
              <span className="tt-sig-notes" style={{ fontFamily: 'Georgia, serif' }}>{chord}</span>
              <span className="tt-sig-notes">{CHORD_NAMES['G'][chord]}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 12, fontSize: '0.9rem', color: '#6c7a8d' }}>
          Bar 12 (V7) is the <em>turnaround</em> — it leads back to bar 1 to restart the cycle.
          Many variations substitute different chords here (e.g., V7–IV7 or a chromatic run).
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Why dominant 7ths?</h2>
        <p>
          In standard harmony, a dominant 7th chord creates tension that resolves to the tonic.
          In the blues, <em>every</em> chord is a dominant 7th — the I7, IV7, and V7 all contain
          a minor 7th interval. This gives the blues its characteristic "unresolved" quality —
          every chord has tension, there's nowhere to truly rest.
        </p>
        <p className="tt-learn-tip">
          💡 The tension in a dominant 7th chord comes from the tritone between its major 3rd and
          minor 7th. In G7, that's B and F — a dissonant interval that wants to resolve.
          In the blues, this tension is constant and that's the whole point.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Common variations</h2>
        <ul className="tt-learn-list">
          <li><strong>Quick change:</strong> bar 2 moves to IV7 instead of staying on I7, then returns to I7.</li>
          <li><strong>Shuffle feel:</strong> the underlying rhythm is swung/triplet — ♩♩ played as ♩𝅘𝅥𝅮♩𝅘𝅥𝅮 (long-short).</li>
          <li><strong>Jazz blues:</strong> adds ii–V substitutions, tritone subs, and chromatic chords for a richer palette.</li>
          <li><strong>Minor blues:</strong> replaces major 3rds with minor 3rds — gives a darker, more melancholic feel.</li>
          <li><strong>8-bar blues:</strong> a compressed version (bars 1–4 I, 5–6 IV, 7 I, 8 V) used in many folk and early rock songs.</li>
        </ul>
      </section>

      <section className="tt-learn-section">
        <h2>The blues scale</h2>
        <p>
          Blues melody is drawn from the <strong>blues scale</strong>: root, ♭3rd, 4th, ♭5th (blue note),
          5th, ♭7th. The ♭3rd and ♭5th — called <em>blue notes</em> — are chromatic notes not in the
          major scale. They're played against the dominant 7th chords to create the characteristic
          bending, expressive sound of the genre.
        </p>
        <p>
          In G blues: G – B♭ – C – D♭ – D – F. All six notes work over all three chords (G7, C7, D7),
          which is what makes the blues scale so immediately expressive and easy to improvise with.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function Quiz() {
  const [mode, setMode] = useState<BluesMode>('bar-to-roman')
  const [question, setQuestion] = useState<BluesQuestion>(() => bPick())
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const timerRef = useRef<number | null>(null)
  const modeRef = useRef<BluesMode>('bar-to-roman')
  modeRef.current = mode

  const switchMode = useCallback((m: BluesMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    modeRef.current = m
    setMode(m); setQuestion(bPick())
    setSelected(null); setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance(excludeBar: number) {
    setQuestion(bPick(excludeBar)); setSelected(null)
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = modeRef.current === 'bar-to-roman'
      ? question.answer
      : CHORD_NAMES[question.key][question.answer]
    const correct = choice === answer
    setSelected(choice); setTotal(t => t + 1)
    if (correct) { setScore(s => s + 1); setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n }) }
    else setStreak(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (correct) timerRef.current = window.setTimeout(() => advance(question.bar), 650)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer = mode === 'bar-to-roman'
    ? question.answer
    : CHORD_NAMES[question.key][question.answer]

  const choices = mode === 'bar-to-roman'
    ? (ROMAN_OPTIONS as string[])
    : ROMAN_OPTIONS.map(r => CHORD_NAMES[question.key][r])

  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  return (
    <div className="nq-root">
      <div className="nq-mode-row">
        <button type="button" className={`nq-mode-btn${mode === 'bar-to-roman' ? ' active' : ''}`} onClick={() => switchMode('bar-to-roman')}>Bar → Roman</button>
        <button type="button" className={`nq-mode-btn${mode === 'bar-to-chord' ? ' active' : ''}`} onClick={() => switchMode('bar-to-chord')}>Bar → Chord Name</button>
      </div>
      <div className="nq-score-row">
        <div className="nq-stat"><span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span><span className="nq-stat-label">correct</span></div>
        {accuracy !== null && <div className="nq-stat"><span className="nq-stat-value">{accuracy}%</span><span className="nq-stat-label">accuracy</span></div>}
        <div className="nq-stat"><span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span><span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span></div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem' }}>
          Bar {question.bar}
        </div>
        <div className="theory-q-sub">
          {mode === 'bar-to-roman'
            ? 'What chord (Roman numeral) is played here in the 12-bar blues?'
            : <>What chord is played here in <strong>{question.key} blues</strong>?</>}
        </div>
      </div>

      <div className="nq-choices">
        {choices.map(choice => {
          const isCorrect = choice === answer; const isSelected = choice === selected
          let cls = 'nq-choice'
          if (selected !== null) { if (isSelected && isCorrect) cls += ' nq-correct'; else if (isSelected) cls += ' nq-wrong'; else if (isCorrect) cls += ' nq-reveal' }
          return <button key={choice} type="button" className={cls} style={{ fontFamily: 'Georgia, serif' }} onClick={() => handleAnswer(choice)} disabled={selected !== null}>
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
          onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); advance(question.bar) }}
        >
          Next →
        </button>
      )}
      <p className="nq-hint">Bars 1–4: I7 · Bars 5–6: IV7 · Bar 7–8: I7 · Bar 9: V7 · Bar 10: IV7 · Bars 11–12: I7–V7</p>
    </div>
  )
}

export function Blues() {
  usePageTitle('The 12-Bar Blues')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>The 12-Bar Blues</h1>
        <p className="tt-page-sub">A structure so universal it deserves its own lesson — three dominant 7th chords that underpin a century of popular music.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🎸"
          title="Blues"
          description="The blues is the foundation of jazz, rock, and soul. Its 12-bar form and pentatonic scale with the added ♭5 'blue note' create the characteristic tension-and-release that drives the most emotional music in the western tradition."
          keyFact="The blues scale adds just one note to the minor pentatonic: the ♭5 (tritone). That single note is responsible for the expressive, bittersweet quality of blues music."
          color="hsl(215, 65%, 45%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<Quiz />}
        topicName="the blues"
        gamesLabel="Practice"
      />
    </div>
  )
}
