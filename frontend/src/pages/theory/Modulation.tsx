/**
 * Modulation — theory topic page.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
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

function pickPivot(excludeFromKey?: string): PivotQuestion {
  const pool = excludeFromKey ? PIVOT_QUESTIONS.filter(p => p.fromKey !== excludeFromKey) : PIVOT_QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

function pickModType(excludeQ?: string): ModTypeQuestion {
  const pool = excludeQ ? MOD_TYPE_QUESTIONS.filter(q => q.description !== excludeQ) : MOD_TYPE_QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

type ModMode = 'pivot-chords' | 'mod-types'

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

function Quiz() {
  const [mode, setMode] = useState<ModMode>('pivot-chords')
  const [pivotQ, setPivotQ] = useState<PivotQuestion>(() => pickPivot())
  const [modTypeQ, setModTypeQ] = useState<ModTypeQuestion>(() => pickModType())
  const [pivotChoices, setPivotChoices] = useState<string[]>(() => {
    const pq = pickPivot()
    return [pq.romanInFrom, pq.romanInTo,
      PIVOT_QUESTIONS.find(p => p.romanInFrom !== pq.romanInFrom)?.romanInFrom ?? 'iii',
      PIVOT_QUESTIONS.find(p => p.romanInTo !== pq.romanInTo)?.romanInTo ?? 'IV',
    ].filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5)
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [pivotStep, setPivotStep] = useState<'from' | 'to'>('from')
  const timerRef = useRef<number | null>(null)
  const modeRef = useRef<ModMode>('pivot-chords')
  modeRef.current = mode

  function makePivotChoices(pq: PivotQuestion, step: 'from' | 'to'): string[] {
    const answer = step === 'from' ? pq.romanInFrom : pq.romanInTo
    const allRomans = [...new Set(PIVOT_QUESTIONS.map(p => step === 'from' ? p.romanInFrom : p.romanInTo))]
    const others = allRomans.filter(r => r !== answer).sort(() => Math.random() - 0.5).slice(0, 3)
    return [...others, answer].sort(() => Math.random() - 0.5)
  }

  const switchMode = useCallback((m: ModMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    modeRef.current = m
    const pq = pickPivot(); const mq = pickModType()
    setMode(m); setPivotQ(pq); setModTypeQ(mq)
    setPivotChoices(makePivotChoices(pq, 'from'))
    setPivotStep('from')
    setSelected(null); setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance() {
    const m = modeRef.current
    if (m === 'pivot-chords') {
      const pq = pickPivot(pivotQ.fromKey)
      setPivotQ(pq); setPivotStep('from')
      setPivotChoices(makePivotChoices(pq, 'from'))
      setSelected(null)
    } else {
      const mq = pickModType(modTypeQ.description)
      setModTypeQ(mq)
      setSelected(null)
    }
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    let answer: string
    if (mode === 'pivot-chords') {
      answer = pivotStep === 'from' ? pivotQ.romanInFrom : pivotQ.romanInTo
    } else {
      answer = modTypeQ.answer
    }
    const correct = choice === answer
    setSelected(choice); setTotal(t => t + 1)
    if (correct) { setScore(s => s + 1); setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n }) }
    else setStreak(0)
    if (timerRef.current) clearTimeout(timerRef.current)

    if (mode === 'pivot-chords' && correct && pivotStep === 'from') {
      // Move to part 2 of the same question
      timerRef.current = window.setTimeout(() => {
        setPivotStep('to')
        setPivotChoices(makePivotChoices(pivotQ, 'to'))
        setSelected(null)
      }, 650)
    } else if (correct) {
      timerRef.current = window.setTimeout(advance, 650)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const accuracy = total > 0 ? Math.round((score / total) * 100) : null
  const modTypeChoices = modTypeQ.choices

  const pivotAnswer = pivotStep === 'from' ? pivotQ.romanInFrom : pivotQ.romanInTo
  const currentChoices = mode === 'pivot-chords' ? pivotChoices : modTypeChoices
  const answer = mode === 'pivot-chords' ? pivotAnswer : modTypeQ.answer

  return (
    <div className="nq-root">
      <div className="nq-mode-row">
        <button type="button" className={`nq-mode-btn${mode === 'pivot-chords' ? ' active' : ''}`} onClick={() => switchMode('pivot-chords')}>Pivot Chords</button>
        <button type="button" className={`nq-mode-btn${mode === 'mod-types' ? ' active' : ''}`} onClick={() => switchMode('mod-types')}>Modulation Types</button>
      </div>
      <div className="nq-score-row">
        <div className="nq-stat"><span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span><span className="nq-stat-label">correct</span></div>
        {accuracy !== null && <div className="nq-stat"><span className="nq-stat-value">{accuracy}%</span><span className="nq-stat-label">accuracy</span></div>}
        <div className="nq-stat"><span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span><span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span></div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        {mode === 'pivot-chords' ? (
          <>
            <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>{pivotQ.pivot}</div>
            <div className="theory-q-sub">
              {pivotStep === 'from'
                ? <>This chord is the pivot between <strong>{pivotQ.fromKey}</strong> and <strong>{pivotQ.toKey}</strong>. What Roman numeral is it in <strong>{pivotQ.fromKey}</strong>?</>
                : <>Now — what Roman numeral is <strong>{pivotQ.pivot}</strong> in <strong>{pivotQ.toKey}</strong>?</>}
            </div>
          </>
        ) : (
          <>
            <div className="theory-q-sub" style={{ fontSize: '0.95rem', textAlign: 'center', padding: '0 8px' }}>{modTypeQ.description}</div>
            {selected !== null && (
              <div className="theory-q-sub" style={{ marginTop: 10, fontSize: '0.85rem', color: '#555' }}>{modTypeQ.explanation}</div>
            )}
          </>
        )}
      </div>

      <div className="nq-choices">
        {currentChoices.map(choice => {
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
          onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); advance() }}
        >
          Next →
        </button>
      )}
      <p className="nq-hint">Pivot = same chord, two functions · Confirmed by V–I in new key</p>
    </div>
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
        gamesContent={<Quiz />}
        topicName="modulation"
        gamesLabel="Practice"
      />
    </div>
  )
}
