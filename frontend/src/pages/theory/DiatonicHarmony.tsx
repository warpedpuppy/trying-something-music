/**
 * Diatonic Harmony & Roman Numerals — theory topic page.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

const SCALE_NOTES: Record<string, string[]> = {
  'C':  ['C','D','E','F','G','A','B'],
  'G':  ['G','A','B','C','D','E','F♯'],
  'D':  ['D','E','F♯','G','A','B','C♯'],
  'A':  ['A','B','C♯','D','E','F♯','G♯'],
  'E':  ['E','F♯','G♯','A','B','C♯','D♯'],
  'B':  ['B','C♯','D♯','E','F♯','G♯','A♯'],
  'F':  ['F','G','A','B♭','C','D','E'],
  'B♭': ['B♭','C','D','E♭','F','G','A'],
  'E♭': ['E♭','F','G','A♭','B♭','C','D'],
  'A♭': ['A♭','B♭','C','D♭','E♭','F','G'],
  'D♭': ['D♭','E♭','F','G♭','A♭','B♭','C'],
}

const KEYS = Object.keys(SCALE_NOTES)
const ROMANS    = ['I','ii','iii','IV','V','vi','vii°']
const QUALITIES = ['major','minor','minor','major','major','minor','diminished'] as const
const SUFFIXES  = ['','m','m','','','m','°']

type Quality = typeof QUALITIES[number]

interface DiatonicChord { roman: string; quality: Quality; name: string }

function getChords(key: string): DiatonicChord[] {
  return ROMANS.map((roman, i) => ({
    roman,
    quality: QUALITIES[i],
    name: SCALE_NOTES[key][i] + SUFFIXES[i],
  }))
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  const exampleKey = 'C'
  const exampleChords = getChords(exampleKey)
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>Why Roman numerals?</h2>
        <p>
          Writing chord names as <strong>Roman numerals</strong> (I, ii, iii, IV, V, vi, vii°)
          captures the <em>function</em> of a chord rather than its specific letter name.
          The progression I–V–vi–IV sounds the same emotionally whether you play it in C, G,
          or F♯ — Roman numerals let you describe that pattern once and apply it to all 12 keys.
        </p>
        <p>
          Uppercase numerals = <strong>major</strong> chords.
          Lowercase numerals = <strong>minor</strong> chords.
          A degree symbol (°) = <strong>diminished</strong>.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The seven diatonic chords</h2>
        <p>
          Every major key contains exactly seven chords built from its own scale notes.
          The quality pattern is always the same: <strong>Major – minor – minor – Major – Major – minor – diminished</strong>.
        </p>
        <div className="tt-roman-row">
          {exampleChords.map(c => (
            <span key={c.roman} className={`tt-roman-pill ${c.quality === 'major' ? 'tt-roman-major' : 'tt-roman-minor'}`}>
              {c.roman}
            </span>
          ))}
        </div>
        <p className="tt-roman-note">In C major: {exampleChords.map(c => c.name).join(' – ')}</p>
      </section>

      <section className="tt-learn-section">
        <h2>Chord function</h2>
        <p>Diatonic chords fall into three functional groups:</p>
        <ul className="tt-learn-list">
          <li>
            <strong>Tonic (T) — I, iii, vi:</strong> stable, home-feeling chords. Music can rest here.
          </li>
          <li>
            <strong>Subdominant (S) — ii, IV:</strong> move away from home, create gentle tension.
          </li>
          <li>
            <strong>Dominant (D) — V, vii°:</strong> strong tension, powerful pull back to I.
            The V chord contains the leading tone (degree 7), which resolves upward to the tonic.
          </li>
        </ul>
        <p className="tt-learn-tip">
          💡 The most satisfying progressions generally follow the path T → S → D → T —
          building tension and releasing it. I–ii–V–I, I–IV–V–I, and vi–IV–V–I all follow this logic.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Reading the Roman numeral in any key</h2>
        <p>
          To find chord IV in A major: the 4th scale degree of A major is D.
          Chord IV in a major key is always major, so chord IV in A major is <strong>D major</strong>.
        </p>
        <p>
          To find chord vi in B♭ major: the 6th degree is G. Chord vi is always minor,
          so it's <strong>Gm</strong>.
        </p>
        <div className="tt-sig-table" style={{ marginTop: 14 }}>
          <div className="tt-sig-row tt-sig-header">
            <span>Key</span>
            {ROMANS.map(r => <span key={r}>{r}</span>)}
          </div>
          {['C','G','D','F','B♭'].map(key => (
            <div key={key} className="tt-sig-row" style={{ gridTemplateColumns: `1fr repeat(${ROMANS.length}, 1fr)` }}>
              <span className="tt-sig-key">{key}</span>
              {getChords(key).map(c => (
                <span key={c.roman} className="tt-sig-notes">{c.name}</span>
              ))}
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

type DHMode = 'chord-to-roman' | 'roman-to-chord'

interface DHQuestion { key: string; chord: DiatonicChord }

function dhPick(excludeKey?: string): DHQuestion {
  const pool = excludeKey ? KEYS.filter(k => k !== excludeKey) : KEYS
  const key   = pool[Math.floor(Math.random() * pool.length)]
  const idx   = Math.floor(Math.random() * 7)
  return { key, chord: getChords(key)[idx] }
}

function dhChoices(mode: DHMode, q: DHQuestion): string[] {
  const answer = mode === 'chord-to-roman' ? q.chord.roman : q.chord.name
  const pool = mode === 'chord-to-roman' ? ROMANS : getChords(q.key).map(c => c.name)
  const others = pool.filter(v => v !== answer).sort(() => Math.random() - 0.5).slice(0, 3)
  return [...others, answer].sort(() => Math.random() - 0.5)
}

function Quiz() {
  const [mode, setMode]         = useState<DHMode>('chord-to-roman')
  const [question, setQuestion] = useState<DHQuestion>(() => dhPick())
  const [choices, setChoices]   = useState<string[]>(() => dhChoices('chord-to-roman', question))
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore]       = useState(0)
  const [total, setTotal]       = useState(0)
  const [streak, setStreak]     = useState(0)
  const [best, setBest]         = useState(0)
  const timerRef = useRef<number | null>(null)
  const modeRef  = useRef<DHMode>('chord-to-roman')
  modeRef.current = mode

  const switchMode = useCallback((m: DHMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    modeRef.current = m
    const q = dhPick()
    setMode(m); setQuestion(q); setChoices(dhChoices(m, q))
    setSelected(null); setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance(fromKey: string) {
    const m = modeRef.current; const q = dhPick(fromKey)
    setQuestion(q); setChoices(dhChoices(m, q)); setSelected(null)
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = modeRef.current === 'chord-to-roman' ? question.chord.roman : question.chord.name
    const correct = choice === answer
    setSelected(choice); setTotal(t => t + 1)
    if (correct) { setScore(s => s + 1); setStreak(s => { const n = s+1; setBest(b => Math.max(b,n)); return n }) }
    else setStreak(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => advance(question.key), correct ? 650 : 1200)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer = mode === 'chord-to-roman' ? question.chord.roman : question.chord.name
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  return (
    <div className="nq-root">
      <div className="nq-mode-row">
        <button type="button" className={`nq-mode-btn${mode==='chord-to-roman'?' active':''}`} onClick={() => switchMode('chord-to-roman')}>Chord → Roman</button>
        <button type="button" className={`nq-mode-btn${mode==='roman-to-chord'?' active':''}`} onClick={() => switchMode('roman-to-chord')}>Roman → Chord</button>
      </div>
      <div className="nq-score-row">
        <div className="nq-stat"><span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span><span className="nq-stat-label">correct</span></div>
        {accuracy !== null && <div className="nq-stat"><span className="nq-stat-value">{accuracy}%</span><span className="nq-stat-label">accuracy</span></div>}
        <div className="nq-stat"><span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span><span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span></div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected===answer?' theory-q-correct':' theory-q-wrong') : ''}`}>
        {mode === 'chord-to-roman' ? (
          <>
            <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>{question.chord.name}</div>
            <div className="theory-q-sub">What Roman numeral is this in <strong>{question.key} major</strong>?</div>
          </>
        ) : (
          <>
            <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>{question.chord.roman}</div>
            <div className="theory-q-sub">What chord is this in <strong>{question.key} major</strong>?</div>
          </>
        )}
      </div>

      <div className="nq-choices">
        {choices.map(choice => {
          const isCorrect = choice === answer; const isSelected = choice === selected
          let cls = 'nq-choice'
          if (selected !== null) { if (isSelected && isCorrect) cls += ' nq-correct'; else if (isSelected) cls += ' nq-wrong'; else if (isCorrect) cls += ' nq-reveal' }
          return <button key={choice} type="button" className={cls} style={{ fontFamily: 'Georgia, serif' }} onClick={() => handleAnswer(choice)} disabled={selected !== null}>{choice}</button>
        })}
      </div>
      <p className="nq-hint">I ii iii IV V vi vii°  ·  Uppercase = major, lowercase = minor</p>
    </div>
  )
}

export function DiatonicHarmony() {
  usePageTitle('Diatonic Harmony & Roman Numerals')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Diatonic Harmony &amp; Roman Numerals</h1>
        <p className="tt-page-sub">Analyse chords by function rather than letter name — the same patterns work in every key.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="📐"
          title="Diatonic Harmony"
          description="Diatonic harmony means using only the chords built from the notes of a single scale. Each scale degree generates a chord with a predictable quality — I and IV and V are major; ii, iii, vi are minor; vii° is diminished."
          keyFact="Roman numerals (I, ii, iii, IV, V, vi, vii°) describe chord function independent of key — so I–IV–V means the same emotional journey in every key."
          color="hsl(130, 55%, 38%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<Quiz />}
        topicName="diatonic harmony"
        gamesLabel="Practice"
      />
    </div>
  )
}
