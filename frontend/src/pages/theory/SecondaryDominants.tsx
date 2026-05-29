/**
 * Secondary Dominants — theory topic page.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

interface SecDom {
  symbol: string       // e.g. "V/ii"
  roman: string        // target chord roman numeral: "ii"
  targetName: string   // e.g. "Dm" in C major
  chord: string        // e.g. "A7" in C major
  key: string          // e.g. "C major"
  keyNote: string      // tonic note
}

// All secondary dominants for C major (static reference, quiz rotates keys)
const C_MAJOR_SEC_DOMS: SecDom[] = [
  { symbol: 'V/ii',  roman: 'ii',  targetName: 'Dm', chord: 'A7',  key: 'C major', keyNote: 'C' },
  { symbol: 'V/iii', roman: 'iii', targetName: 'Em', chord: 'B7',  key: 'C major', keyNote: 'C' },
  { symbol: 'V/IV',  roman: 'IV',  targetName: 'F',  chord: 'C7',  key: 'C major', keyNote: 'C' },
  { symbol: 'V/V',   roman: 'V',   targetName: 'G',  chord: 'D7',  key: 'C major', keyNote: 'C' },
  { symbol: 'V/vi',  roman: 'vi',  targetName: 'Am', chord: 'E7',  key: 'C major', keyNote: 'C' },
]

const G_MAJOR_SEC_DOMS: SecDom[] = [
  { symbol: 'V/ii',  roman: 'ii',  targetName: 'Am', chord: 'E7',  key: 'G major', keyNote: 'G' },
  { symbol: 'V/IV',  roman: 'IV',  targetName: 'C',  chord: 'G7',  key: 'G major', keyNote: 'G' },
  { symbol: 'V/V',   roman: 'V',   targetName: 'D',  chord: 'A7',  key: 'G major', keyNote: 'G' },
  { symbol: 'V/vi',  roman: 'vi',  targetName: 'Em', chord: 'B7',  key: 'G major', keyNote: 'G' },
]

const F_MAJOR_SEC_DOMS: SecDom[] = [
  { symbol: 'V/ii',  roman: 'ii',  targetName: 'Gm',  chord: 'D7', key: 'F major', keyNote: 'F' },
  { symbol: 'V/IV',  roman: 'IV',  targetName: 'B♭',  chord: 'F7', key: 'F major', keyNote: 'F' },
  { symbol: 'V/V',   roman: 'V',   targetName: 'C',   chord: 'G7', key: 'F major', keyNote: 'F' },
  { symbol: 'V/vi',  roman: 'vi',  targetName: 'Dm',  chord: 'A7', key: 'F major', keyNote: 'F' },
]

const ALL_SEC_DOMS = [...C_MAJOR_SEC_DOMS, ...G_MAJOR_SEC_DOMS, ...F_MAJOR_SEC_DOMS]

type SDMode = 'symbol-to-chord' | 'chord-to-target'

function sdPick(exclude?: string): SecDom {
  const pool = exclude ? ALL_SEC_DOMS.filter(s => s.symbol + s.key !== exclude) : ALL_SEC_DOMS
  return pool[Math.floor(Math.random() * pool.length)]
}

function sdChoices(mode: SDMode, q: SecDom): string[] {
  const answer = mode === 'symbol-to-chord' ? q.chord : q.targetName
  const pool = mode === 'symbol-to-chord'
    ? [...new Set(ALL_SEC_DOMS.filter(s => s.key === q.key).map(s => s.chord))]
    : [...new Set(ALL_SEC_DOMS.filter(s => s.key === q.key).map(s => s.targetName))]
  const others = pool.filter(v => v !== answer).sort(() => Math.random() - 0.5).slice(0, 3)
  return [...others, answer].sort(() => Math.random() - 0.5)
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a secondary dominant?</h2>
        <p>
          Every major chord in a key can be preceded by <em>its own</em> dominant 7th chord —
          even if that chord doesn't belong to the key. This borrowed dominant is called a
          <strong> secondary dominant</strong>. It adds a brief but powerful pull toward a
          non-tonic chord.
        </p>
        <p>
          The notation <strong>V/X</strong> means "the V chord <em>of</em> X."
          So in C major, <strong>V/V</strong> means "the dominant of G" — which is D7.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Secondary dominants in C major</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <span>Symbol</span><span>Chord</span><span>Resolves to</span>
          </div>
          {C_MAJOR_SEC_DOMS.map(sd => (
            <div key={sd.symbol} className="tt-sig-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <span className="tt-sig-key" style={{ fontFamily: 'Georgia, serif' }}>{sd.symbol}</span>
              <span className="tt-sig-notes">{sd.chord}</span>
              <span className="tt-sig-notes">{sd.targetName} ({sd.roman})</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 10, fontSize: '0.9rem', color: '#6c7a8d' }}>
          Notice that V/IV = C7 — a C major chord with a ♭7, which normally sounds like a blues move.
          That's exactly what it is! The IV chord (F) acts as the "tonic" and C7 is its dominant.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>How to build a secondary dominant</h2>
        <ol className="tt-learn-list">
          <li>Identify the target chord (e.g., ii = Dm in C major).</li>
          <li>Find the root a perfect 5th above that chord's root (D → A).</li>
          <li>Build a dominant 7th chord on that root (A7 = A–C♯–E–G).</li>
          <li>The resulting chord is V/ii — use it just before the ii chord.</li>
        </ol>
        <p className="tt-learn-tip">
          💡 A dominant 7th chord creates a strong pull to the chord a 5th below. Secondary dominants
          exploit this by temporarily treating any major (or minor) chord as a local tonic.
          Hear it in "I Will Survive" (E7–Am), "Hey Joe" (C–G–D–A–E7), and thousands of jazz standards.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The most common secondary dominant</h2>
        <p>
          <strong>V/V</strong> (pronounced "five of five") is by far the most common.
          In C major it's D7, which pulls strongly to G, which then resolves to C.
          The result — <strong>I – V/V – V – I</strong> — is one of the oldest and most satisfying
          gestures in tonal music, found everywhere from Baroque to pop.
        </p>
        <p>
          Listen for the moment a song temporarily "sharpens" — that raised pitch is usually the
          major 3rd of a secondary dominant doing its job.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function Quiz() {
  const [mode, setMode] = useState<SDMode>('symbol-to-chord')
  const [question, setQuestion] = useState<SecDom>(() => sdPick())
  const [choices, setChoices] = useState<string[]>(() => sdChoices('symbol-to-chord', sdPick()))
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const timerRef = useRef<number | null>(null)
  const modeRef = useRef<SDMode>('symbol-to-chord')
  modeRef.current = mode

  const switchMode = useCallback((m: SDMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    modeRef.current = m
    const q = sdPick()
    setMode(m); setQuestion(q); setChoices(sdChoices(m, q))
    setSelected(null); setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance(excludeKey: string) {
    const m = modeRef.current
    const q = sdPick(excludeKey)
    setQuestion(q); setChoices(sdChoices(m, q)); setSelected(null)
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = modeRef.current === 'symbol-to-chord' ? question.chord : question.targetName
    const correct = choice === answer
    setSelected(choice); setTotal(t => t + 1)
    if (correct) { setScore(s => s + 1); setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n }) }
    else setStreak(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => advance(question.symbol + question.key), correct ? 650 : 1200)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer = mode === 'symbol-to-chord' ? question.chord : question.targetName
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  return (
    <div className="nq-root">
      <div className="nq-mode-row">
        <button type="button" className={`nq-mode-btn${mode === 'symbol-to-chord' ? ' active' : ''}`} onClick={() => switchMode('symbol-to-chord')}>Symbol → Chord</button>
        <button type="button" className={`nq-mode-btn${mode === 'chord-to-target' ? ' active' : ''}`} onClick={() => switchMode('chord-to-target')}>Symbol → Resolves to</button>
      </div>
      <div className="nq-score-row">
        <div className="nq-stat"><span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span><span className="nq-stat-label">correct</span></div>
        {accuracy !== null && <div className="nq-stat"><span className="nq-stat-value">{accuracy}%</span><span className="nq-stat-label">accuracy</span></div>}
        <div className="nq-stat"><span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span><span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span></div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>{question.symbol}</div>
        <div className="theory-q-sub">
          {mode === 'symbol-to-chord'
            ? <>What chord is this in <strong>{question.key}</strong>?</>
            : <>What chord does this resolve to in <strong>{question.key}</strong>?</>}
        </div>
      </div>

      <div className="nq-choices">
        {choices.map(choice => {
          const isCorrect = choice === answer; const isSelected = choice === selected
          let cls = 'nq-choice'
          if (selected !== null) { if (isSelected && isCorrect) cls += ' nq-correct'; else if (isSelected) cls += ' nq-wrong'; else if (isCorrect) cls += ' nq-reveal' }
          return <button key={choice} type="button" className={cls} onClick={() => handleAnswer(choice)} disabled={selected !== null}>{choice}</button>
        })}
      </div>
      <p className="nq-hint">V/X = the dominant 7th of chord X · V/V in C = D7 (resolves to G)</p>
    </div>
  )
}

export function SecondaryDominants() {
  usePageTitle('Secondary Dominants')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Secondary Dominants</h1>
        <p className="tt-page-sub">Borrow the dominant chord from any neighbouring key to create a powerful pull toward any diatonic chord.</p>
      </div>
      <TheoryTopicLayout learnContent={<LearnContent />} gamesContent={<Quiz />} topicName="secondary dominants" gamesLabel="Practice" />
    </div>
  )
}
