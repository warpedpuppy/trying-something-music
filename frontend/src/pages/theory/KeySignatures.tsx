/**
 * Key Signatures — theory topic page.
 *
 * Learn  — what a key signature is, sharp/flat orders, identification shortcuts
 * Practice — bidirectional quiz: key ↔ signature
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

const SHARP_ORDER = ['F♯','C♯','G♯','D♯','A♯','E♯','B♯']
const FLAT_ORDER  = ['B♭','E♭','A♭','D♭','G♭','C♭','F♭']

interface KeySig {
  key: string
  sf: number
  sfLabel: string
  accidentals: string[]
}

const KEY_SIGS: KeySig[] = [
  { key: 'C',  sf:  0, sfLabel: '—',  accidentals: [] },
  { key: 'G',  sf:  1, sfLabel: '1♯', accidentals: SHARP_ORDER.slice(0, 1) },
  { key: 'D',  sf:  2, sfLabel: '2♯', accidentals: SHARP_ORDER.slice(0, 2) },
  { key: 'A',  sf:  3, sfLabel: '3♯', accidentals: SHARP_ORDER.slice(0, 3) },
  { key: 'E',  sf:  4, sfLabel: '4♯', accidentals: SHARP_ORDER.slice(0, 4) },
  { key: 'B',  sf:  5, sfLabel: '5♯', accidentals: SHARP_ORDER.slice(0, 5) },
  { key: 'F♯', sf:  6, sfLabel: '6♯', accidentals: SHARP_ORDER.slice(0, 6) },
  { key: 'F',  sf: -1, sfLabel: '1♭', accidentals: FLAT_ORDER.slice(0, 1) },
  { key: 'B♭', sf: -2, sfLabel: '2♭', accidentals: FLAT_ORDER.slice(0, 2) },
  { key: 'E♭', sf: -3, sfLabel: '3♭', accidentals: FLAT_ORDER.slice(0, 3) },
  { key: 'A♭', sf: -4, sfLabel: '4♭', accidentals: FLAT_ORDER.slice(0, 4) },
  { key: 'D♭', sf: -5, sfLabel: '5♭', accidentals: FLAT_ORDER.slice(0, 5) },
  { key: 'G♭', sf: -6, sfLabel: '6♭', accidentals: FLAT_ORDER.slice(0, 6) },
]

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function KeySigsLearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a key signature?</h2>
        <p>
          A <strong>key signature</strong> appears at the start of every staff line, right
          after the clef. It lists the notes that are permanently sharp or flat throughout the
          piece, so the composer doesn't need to write accidentals on every individual note.
        </p>
        <p>
          Two sharps (F♯ and C♯) at the start of every line means every F and C in the
          music is sharp — unless a natural sign cancels it. Two sharps signals the key
          of D major.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Sharp keys <span className="tt-clef-glyph">♯</span></h2>
        <p>
          Moving <strong>clockwise</strong> around the circle of fifths adds one sharp per
          step. Sharps are always added in the same fixed order:
          <strong> F  C  G  D  A  E  B</strong>.
          Mnemonic: <em>"Father Charles Goes Down And Ends Battle."</em>
        </p>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header">
            <span>Key</span><span>Sharps</span><span>Notes added</span>
          </div>
          {KEY_SIGS.filter(k => k.sf >= 0).map(k => (
            <div key={k.key} className="tt-sig-row">
              <span className="tt-sig-key">{k.key} major</span>
              <span>{k.sfLabel}</span>
              <span className="tt-sig-notes">{k.accidentals.join(', ') || 'none'}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>Flat keys <span className="tt-clef-glyph">♭</span></h2>
        <p>
          Moving <strong>counter-clockwise</strong> adds one flat per step.
          Flats are added in the order <strong>B  E  A  D  G  C  F</strong> — the
          sharp order reversed. Mnemonic: <em>"Battle Ends And Down Goes Charles's Father."</em>
        </p>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header">
            <span>Key</span><span>Flats</span><span>Notes added</span>
          </div>
          {KEY_SIGS.filter(k => k.sf < 0).map(k => (
            <div key={k.key} className="tt-sig-row">
              <span className="tt-sig-key">{k.key} major</span>
              <span>{k.sfLabel}</span>
              <span className="tt-sig-notes">{k.accidentals.join(', ')}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>Quick identification shortcuts</h2>
        <ul className="tt-learn-list">
          <li>
            <strong>Sharp keys:</strong> the last sharp added is always one half-step below
            the tonic. Three sharps = F♯, C♯, G♯. Last sharp: G♯. One half-step above G♯ = A.
            Key: <strong>A major</strong>.
          </li>
          <li>
            <strong>Flat keys:</strong> the second-to-last flat is the key name.
            Three flats = B♭, E♭, A♭. Second-to-last: E♭. Key: <strong>E♭ major</strong>.
            One flat is a special case — always <strong>F major</strong>.
          </li>
          <li>
            <strong>No sharps or flats:</strong> always C major (or its relative, A minor).
          </li>
        </ul>
        <p className="tt-learn-tip">
          💡 Practise naming a key from its signature until you can do it in under two seconds —
          that speed is what allows real-time sight-reading.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

type KSMode = 'key-to-sig' | 'sig-to-key'

function ksPickQuestion(exclude?: string): KeySig {
  const pool = exclude ? KEY_SIGS.filter(k => k.key !== exclude) : KEY_SIGS
  return pool[Math.floor(Math.random() * pool.length)]
}

function ksPickChoices(mode: KSMode, correct: KeySig): string[] {
  const answer = mode === 'key-to-sig' ? correct.sfLabel : correct.key
  const others = KEY_SIGS
    .map(k => (mode === 'key-to-sig' ? k.sfLabel : k.key))
    .filter(v => v !== answer)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  return [...others, answer].sort(() => Math.random() - 0.5)
}

function KeySigsQuiz() {
  const [mode, setMode]         = useState<KSMode>('key-to-sig')
  const [question, setQuestion] = useState<KeySig>(() => ksPickQuestion())
  const [choices, setChoices]   = useState<string[]>(() => ksPickChoices('key-to-sig', question))
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore]       = useState(0)
  const [total, setTotal]       = useState(0)
  const [streak, setStreak]     = useState(0)
  const [best, setBest]         = useState(0)
  const timerRef  = useRef<number | null>(null)
  const modeRef   = useRef<KSMode>('key-to-sig')
  modeRef.current = mode

  const switchMode = useCallback((m: KSMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const q = ksPickQuestion()
    modeRef.current = m
    setMode(m)
    setQuestion(q)
    setChoices(ksPickChoices(m, q))
    setSelected(null)
    setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance(fromKey: string) {
    const q = ksPickQuestion(fromKey)
    setQuestion(q)
    setChoices(ksPickChoices(modeRef.current, q))
    setSelected(null)
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = modeRef.current === 'key-to-sig' ? question.sfLabel : question.key
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

  const answer   = mode === 'key-to-sig' ? question.sfLabel : question.key
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  return (
    <div className="nq-root">

      <div className="nq-mode-row">
        <button type="button" className={`nq-mode-btn${mode === 'key-to-sig' ? ' active' : ''}`}
          onClick={() => switchMode('key-to-sig')}>Key → Signature</button>
        <button type="button" className={`nq-mode-btn${mode === 'sig-to-key' ? ' active' : ''}`}
          onClick={() => switchMode('sig-to-key')}>Signature → Key</button>
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

      {/* Question card */}
      <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        {mode === 'key-to-sig' ? (
          <>
            <div className="theory-q-main">{question.key} major</div>
            <div className="theory-q-sub">How many sharps or flats?</div>
          </>
        ) : (
          <>
            <div className="theory-q-main" style={{ fontSize: '3rem' }}>
              {question.sfLabel === '—' ? '♮' : question.sfLabel}
            </div>
            <div className="theory-q-sub">
              {question.sf === 0 ? 'No sharps or flats' :
               question.sf > 0 ? `${question.sf} sharp${question.sf > 1 ? 's' : ''}` :
                                 `${-question.sf} flat${-question.sf > 1 ? 's' : ''}`}
              {' — which major key?'}
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
              {choice}
            </button>
          )
        })}
      </div>

      <p className="nq-hint">
        Sharps: F C G D A E B  ·  Flats: B E A D G C F
      </p>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function KeySignatures() {
  usePageTitle('Key Signatures')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Key Signatures</h1>
        <p className="tt-page-sub">
          Learn to read sharps and flats at a glance and identify any major key instantly.
        </p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🔑"
          title="Key Signatures"
          description="A key signature is a group of sharps or flats at the beginning of a staff that tells you which scale the piece is written in — so you don't have to write accidentals on every note."
          keyFact="The Circle of Fifths shows all 15 key signatures in order: each step clockwise adds one sharp; each step counter-clockwise adds one flat."
          color="hsl(35, 80%, 45%)"
        />}
        learnContent={<KeySigsLearnContent />}
        gamesContent={<KeySigsQuiz />}
        topicName="key signatures"
        gamesLabel="Practice"
      />
    </div>
  )
}
