/**
 * Borrowed Chords & Modal Mixture — theory topic page.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

interface BorrowedChord {
  roman: string       // e.g. "♭VII"
  symbol: string      // chord name, e.g. "B♭" in C major
  sourceMode: string  // "parallel minor" or "parallel major"
  usage: string       // one-line description of common use
}

const C_MAJOR_BORROWED: BorrowedChord[] = [
  { roman: 'iv',   symbol: 'Fm',  sourceMode: 'parallel minor', usage: 'Minor subdominant — deeply emotive, common in ballads.' },
  { roman: '♭VI',  symbol: 'A♭',  sourceMode: 'parallel minor', usage: 'Flat six — dramatic colour; common in film and rock.' },
  { roman: '♭VII', symbol: 'B♭',  sourceMode: 'parallel minor', usage: 'Flat seven — the most common borrowed chord in rock and pop.' },
  { roman: '♭III', symbol: 'E♭',  sourceMode: 'parallel minor', usage: 'Flat three — lends a heavy, minor-tinged feel.' },
  { roman: 'ii°',  symbol: 'D°',  sourceMode: 'parallel minor', usage: 'Diminished supertonic — used in place of ii or as a passing chord.' },
]

const G_MAJOR_BORROWED: BorrowedChord[] = [
  { roman: 'iv',   symbol: 'Cm',  sourceMode: 'parallel minor', usage: 'Minor subdominant' },
  { roman: '♭VI',  symbol: 'E♭',  sourceMode: 'parallel minor', usage: 'Flat six' },
  { roman: '♭VII', symbol: 'F',   sourceMode: 'parallel minor', usage: 'Flat seven — very common in G-based rock.' },
  { roman: '♭III', symbol: 'B♭',  sourceMode: 'parallel minor', usage: 'Flat three' },
]

const F_MAJOR_BORROWED: BorrowedChord[] = [
  { roman: 'iv',   symbol: 'B♭m', sourceMode: 'parallel minor', usage: 'Minor subdominant' },
  { roman: '♭VI',  symbol: 'D♭',  sourceMode: 'parallel minor', usage: 'Flat six' },
  { roman: '♭VII', symbol: 'E♭',  sourceMode: 'parallel minor', usage: 'Flat seven' },
  { roman: '♭III', symbol: 'A♭',  sourceMode: 'parallel minor', usage: 'Flat three' },
]

const D_MAJOR_BORROWED: BorrowedChord[] = [
  { roman: 'iv',   symbol: 'Gm',  sourceMode: 'parallel minor', usage: 'Minor subdominant' },
  { roman: '♭VI',  symbol: 'B♭',  sourceMode: 'parallel minor', usage: 'Flat six' },
  { roman: '♭VII', symbol: 'C',   sourceMode: 'parallel minor', usage: 'Flat seven' },
  { roman: '♭III', symbol: 'F',   sourceMode: 'parallel minor', usage: 'Flat three' },
]

type KeyName = 'C' | 'G' | 'F' | 'D'
const ALL_BY_KEY: Record<KeyName, BorrowedChord[]> = {
  C: C_MAJOR_BORROWED,
  G: G_MAJOR_BORROWED,
  F: F_MAJOR_BORROWED,
  D: D_MAJOR_BORROWED,
}
const KEYS: KeyName[] = ['C', 'G', 'F', 'D']

interface MMQuestion {
  key: KeyName
  chord: BorrowedChord
}

type MMMode = 'roman-to-chord' | 'chord-to-roman'

function mmPick(excludeKey?: KeyName): MMQuestion {
  const pool = excludeKey ? KEYS.filter(k => k !== excludeKey) : KEYS
  const key = pool[Math.floor(Math.random() * pool.length)] as KeyName
  const borrowed = ALL_BY_KEY[key]
  const chord = borrowed[Math.floor(Math.random() * borrowed.length)]
  return { key, chord }
}

function mmChoices(mode: MMMode, q: MMQuestion): string[] {
  const answer = mode === 'roman-to-chord' ? q.chord.symbol : q.chord.roman
  const allRomans = [...new Set(C_MAJOR_BORROWED.map(b => b.roman))]
  const allSymbols = ALL_BY_KEY[q.key].map(b => b.symbol)
  const pool = mode === 'roman-to-chord' ? allSymbols : allRomans
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
        <h2>What is modal mixture?</h2>
        <p>
          <strong>Modal mixture</strong> (also called <em>borrowed chords</em>) is the technique of
          temporarily pulling chords from a <strong>parallel key</strong> — most often from the
          parallel minor into a major key. While the home key stays major, a borrowed chord introduces
          flatted scale degrees that darken the harmony without leaving the key entirely.
        </p>
        <p>
          Parallel keys share the same tonic note but different scales. C major and C minor are
          parallel — both start on C, but C minor has E♭, A♭, and B♭ where C major has E, A, and B.
          Borrowing from C minor into C major means using chords built on those flatted degrees.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Common borrowed chords in C major</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '80px 80px 1fr' }}>
            <span>Roman</span><span>Chord</span><span>Common use</span>
          </div>
          {C_MAJOR_BORROWED.map(b => (
            <div key={b.roman} className="tt-sig-row" style={{ gridTemplateColumns: '80px 80px 1fr' }}>
              <span className="tt-sig-key" style={{ fontFamily: 'Georgia, serif' }}>{b.roman}</span>
              <span className="tt-sig-notes">{b.symbol}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.85rem' }}>{b.usage}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>The ♭VII chord — the most common borrowed chord</h2>
        <p>
          In C major the ♭VII is B♭ — borrowed from C minor's 7th degree. You hear it everywhere in
          rock: the opening chords of "Hey Jude" (F–E♭–B♭–F), the chorus of "Sweet Home Alabama"
          (D–C–G), countless punk and grunge songs. It has a raw, unresolved energy that feels
          more "rock" than the diatonic vii° ever could.
        </p>
        <p className="tt-learn-tip">
          💡 A quick way to spot a borrowed chord: look for a note outside the key signature that
          can't be explained as a secondary dominant. If it's a flatted scale degree, it's almost
          certainly borrowed from the parallel minor.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The iv chord — the most emotive borrowed chord</h2>
        <p>
          The minor iv chord (Fm in C major) is the borrowed chord most associated with deep
          emotion and longing. When a song in a major key suddenly shifts to the minor iv, the
          effect is almost universally heard as bittersweet or aching.
        </p>
        <p>
          The progression <strong>I – IV – iv – I</strong> is one of the most powerful in all of
          tonal music — the shift from major IV to minor iv creates a breath-catching moment before
          returning home.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Borrowed chords in minor keys</h2>
        <p>
          The borrowing goes both ways. A minor key song can borrow from its parallel major —
          most commonly the Picardy third: ending a minor piece with a major I chord (e.g.,
          finishing a song in C minor on C major). The ♮VII (natural 7th chord) and IV major are
          also commonly borrowed from the parallel major in minor-key music.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function Quiz() {
  const [mode, setMode] = useState<MMMode>('roman-to-chord')
  const [question, setQuestion] = useState<MMQuestion>(() => mmPick())
  const [choices, setChoices] = useState<string[]>(() => {
    const q = mmPick()
    return mmChoices('roman-to-chord', q)
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const timerRef = useRef<number | null>(null)
  const modeRef = useRef<MMMode>('roman-to-chord')
  modeRef.current = mode

  const switchMode = useCallback((m: MMMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    modeRef.current = m
    const q = mmPick()
    setMode(m); setQuestion(q); setChoices(mmChoices(m, q))
    setSelected(null); setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance(excludeKey: KeyName) {
    const m = modeRef.current
    const q = mmPick(excludeKey)
    setQuestion(q); setChoices(mmChoices(m, q)); setSelected(null)
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = modeRef.current === 'roman-to-chord' ? question.chord.symbol : question.chord.roman
    const correct = choice === answer
    setSelected(choice); setTotal(t => t + 1)
    if (correct) { setScore(s => s + 1); setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n }) }
    else setStreak(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (correct) timerRef.current = window.setTimeout(() => advance(question.key), 650)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer = mode === 'roman-to-chord' ? question.chord.symbol : question.chord.roman
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  return (
    <div className="nq-root">
      <div className="nq-mode-row">
        <button type="button" className={`nq-mode-btn${mode === 'roman-to-chord' ? ' active' : ''}`} onClick={() => switchMode('roman-to-chord')}>Roman → Chord</button>
        <button type="button" className={`nq-mode-btn${mode === 'chord-to-roman' ? ' active' : ''}`} onClick={() => switchMode('chord-to-roman')}>Chord → Roman</button>
      </div>
      <div className="nq-score-row">
        <div className="nq-stat"><span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span><span className="nq-stat-label">correct</span></div>
        {accuracy !== null && <div className="nq-stat"><span className="nq-stat-value">{accuracy}%</span><span className="nq-stat-label">accuracy</span></div>}
        <div className="nq-stat"><span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span><span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span></div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        {mode === 'roman-to-chord' ? (
          <>
            <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>{question.chord.roman}</div>
            <div className="theory-q-sub">What is this borrowed chord in <strong>{question.key} major</strong>?</div>
          </>
        ) : (
          <>
            <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>{question.chord.symbol}</div>
            <div className="theory-q-sub">What Roman numeral is this borrowed chord in <strong>{question.key} major</strong>?</div>
          </>
        )}
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
          onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); advance(question.key) }}
        >
          Next →
        </button>
      )}
      <p className="nq-hint">Borrowed from parallel minor · ♭VII = most common in rock · iv = most emotive</p>
    </div>
  )
}

export function ModalMixture() {
  usePageTitle('Borrowed Chords & Modal Mixture')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Borrowed Chords &amp; Modal Mixture</h1>
        <p className="tt-page-sub">Pull chords from the parallel minor to darken a major key — the source of the ♭VII in rock and the iv in a ballad.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🎨"
          title="Modal Mixture"
          description="Modal mixture borrows chords from the parallel minor (or major) key. In C major you can borrow ♭VII (B♭ major) or iv minor (Fm) from C minor — suddenly adding colour that pure C major can't provide."
          keyFact="The ♭VII chord (borrowed from the parallel minor) is the most common mixture chord in rock and pop. It appears in 'Hey Jude', 'Let It Be', and thousands of other songs."
          color="hsl(170, 60%, 38%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<Quiz />}
        topicName="modal mixture"
        gamesLabel="Practice"
      />
    </div>
  )
}
