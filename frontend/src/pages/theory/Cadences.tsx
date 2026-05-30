/**
 * Cadences — theory topic page.
 *
 * Learn   — what a cadence is; authentic, plagal, half, and deceptive cadences
 * Practice — identify the cadence type from a Roman numeral pair
 */

import { useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { usePageTitle } from '../../hooks/usePageTitle'
import { ProgressionPlayer } from '../../components/ProgressionPlayer'
import { CADENCE_SEQUENCES } from '../../lib/theoryAudio'

// ── Data ──────────────────────────────────────────────────────────────────────

type CadenceType = 'Authentic' | 'Plagal' | 'Half' | 'Deceptive'

interface Cadence {
  id: string
  numerals: string[]      // e.g. ['V', 'I']
  type: CadenceType
  description: string
}

const CADENCES: Cadence[] = [
  { id: 'V-I',    numerals: ['V',  'I' ],  type: 'Authentic',  description: 'Strong resolution to the tonic' },
  { id: 'V7-I',   numerals: ['V⁷', 'I' ],  type: 'Authentic',  description: 'Even stronger pull with the 7th' },
  { id: 'ii-I',   numerals: ['ii', 'I' ],  type: 'Authentic',  description: 'ii substitutes for IV → I' },
  { id: 'IV-I',   numerals: ['IV', 'I' ],  type: 'Plagal',     description: 'The "Amen" cadence — softer resolution' },
  { id: 'iv-I',   numerals: ['iv', 'I' ],  type: 'Plagal',     description: 'Minor subdominant to tonic' },
  { id: 'I-V',    numerals: ['I',  'V' ],  type: 'Half',       description: 'Phrase ends on the dominant — tension unresolved' },
  { id: 'ii-V',   numerals: ['ii', 'V' ],  type: 'Half',       description: 'Common setup for the dominant' },
  { id: 'IV-V',   numerals: ['IV', 'V' ],  type: 'Half',       description: 'Subdominant pulling toward dominant' },
  { id: 'V-vi',   numerals: ['V',  'vi'],  type: 'Deceptive',  description: 'Surprise! Avoids the expected I' },
  { id: 'V7-vi',  numerals: ['V⁷', 'vi'],  type: 'Deceptive',  description: 'V7 resolving unexpectedly to vi' },
]

const TYPES: CadenceType[] = ['Authentic', 'Plagal', 'Half', 'Deceptive']

const TYPE_COLOR: Record<CadenceType, string> = {
  Authentic:  'var(--green)',
  Plagal:     'var(--accent)',
  Half:       'var(--amber)',
  Deceptive:  '#9333ea',
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function CadencesLearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a cadence?</h2>
        <p>
          A <strong>cadence</strong> is a chord progression that marks the end of a musical
          phrase — the punctuation of music. Just as a sentence ends with a period, question
          mark, or comma, phrases end with cadences that signal rest, tension, or surprise.
        </p>
        <p>
          Cadences are described using <strong>Roman numerals</strong> that show the
          function of each chord within the key. The same cadence pattern works identically
          in every major key.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Authentic cadence — V → I <span className="tt-clef-glyph" style={{ color: 'var(--green)' }}>✓</span></h2>
        <p>
          The most conclusive cadence in tonal music. The dominant chord (V) resolves to
          the tonic (I), creating a sense of complete rest and finality — like the last word
          of a sentence followed by a period.
        </p>
        <p>
          When V has its 7th added (V⁷ → I), the pull is even stronger because the tritone
          inside the V⁷ chord wants to resolve inward to the tonic. This is called a
          <strong> perfect authentic cadence</strong> and is the most final-sounding ending
          in Western music.
        </p>
        <ProgressionPlayer steps={CADENCE_SEQUENCES.authentic} buttonLabel="▶ Hear V⁷ → I" context="in C major" />
      </section>

      <section className="tt-learn-section">
        <h2>Plagal cadence — IV → I <span className="tt-clef-glyph" style={{ color: 'var(--accent)' }}>♩</span></h2>
        <p>
          The subdominant (IV) moves to the tonic (I). Softer and less decisive than the
          authentic cadence — it feels more like a gentle settling than a firm landing.
          Also called the <strong>"Amen" cadence</strong> because hymns traditionally end
          with the word "A-men" sung over IV–I.
        </p>
        <ProgressionPlayer steps={CADENCE_SEQUENCES.plagal} buttonLabel="▶ Hear IV → I" context="in C major" />
      </section>

      <section className="tt-learn-section">
        <h2>Half cadence — ends on V <span className="tt-clef-glyph" style={{ color: 'var(--amber)' }}>?</span></h2>
        <p>
          Any cadence that <em>ends</em> on the dominant (V) is a half cadence. Like a
          question mark — it creates tension that demands a follow-up phrase.
          Common setups include I→V, ii→V, and IV→V.
        </p>
        <p>
          Half cadences often appear at the end of the first half of a musical sentence,
          with an authentic cadence completing the thought at the end of the second half.
        </p>
        <ProgressionPlayer steps={CADENCE_SEQUENCES.half} buttonLabel="▶ Hear I → V" context="phrase left unresolved" />
      </section>

      <section className="tt-learn-section">
        <h2>Deceptive cadence — V → vi <span className="tt-clef-glyph" style={{ color: '#9333ea' }}>!</span></h2>
        <p>
          The dominant (V) resolves — but not to I as expected. Instead it moves to vi
          (the relative minor), creating a moment of surprise. The listener's ear expected
          the phrase to end; instead the music continues in an unexpected direction.
        </p>
        <p>
          Composers use deceptive cadences to extend phrases, avoid monotony, and create
          emotional depth. Listen for them in the climactic moments of songs where the
          resolution is delayed for dramatic effect.
        </p>
        <ProgressionPlayer steps={CADENCE_SEQUENCES.deceptive} buttonLabel="▶ Hear the surprise" context="I → V⁷ → vi — wait for the twist" />
        <p className="tt-learn-tip">
          💡 All four cadences share a crucial feature: the dominant (V) appears in three
          of them. Recognising when you're on V — and watching where it goes next — is the
          key skill for identifying cadences in real music.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function cadPickQuestion(excludeId?: string): Cadence {
  const pool = excludeId ? CADENCES.filter(c => c.id !== excludeId) : CADENCES
  return pool[Math.floor(Math.random() * pool.length)]
}

function cadPickChoices(correct: Cadence): CadenceType[] {
  const others = TYPES.filter(t => t !== correct.type)
    .sort(() => Math.random() - 0.5)
  return [...others, correct.type].sort(() => Math.random() - 0.5)
}

function CadencesQuiz() {
  const [question, setQuestion] = useState<Cadence>(() => cadPickQuestion())
  const [choices, setChoices]   = useState<CadenceType[]>(() => cadPickChoices(question))
  const [selected, setSelected] = useState<CadenceType | null>(null)
  const [score, setScore]       = useState(0)
  const [total, setTotal]       = useState(0)
  const [streak, setStreak]     = useState(0)
  const [best, setBest]         = useState(0)
  const timerRef = useRef<number | null>(null)

  function advance(fromId: string) {
    const q = cadPickQuestion(fromId)
    setQuestion(q)
    setChoices(cadPickChoices(q))
    setSelected(null)
  }

  function handleAnswer(choice: CadenceType) {
    if (selected !== null) return
    const correct = choice === question.type
    setSelected(choice)
    setTotal(t => t + 1)
    if (correct) {
      setScore(s => s + 1)
      setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n })
    } else {
      setStreak(0)
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => advance(question.id), correct ? 650 : 1400)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const accuracy = total > 0 ? Math.round((score / total) * 100) : null
  const isCorrect = selected !== null && selected === question.type

  return (
    <div className="nq-root">

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

      <div className={`theory-q-card${selected !== null ? (isCorrect ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        {/* Roman numeral pair with arrow */}
        <div className="theory-q-pair">
          {question.numerals.map((n, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {i > 0 && <span className="theory-q-arrow">→</span>}
              <span className="theory-q-numeral">{n}</span>
            </span>
          ))}
        </div>
        <div className="theory-q-sub">{question.description}</div>
        {selected !== null && (
          <div className="theory-q-verdict" style={{ color: isCorrect ? 'var(--green)' : 'var(--red)' }}>
            {isCorrect ? `✓ ${question.type} cadence` : `✗ This is a ${question.type} cadence`}
          </div>
        )}
      </div>

      {/* Choices — single column for longer labels */}
      <div className="nq-choices" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {choices.map(choice => {
          const isThisCorrect  = choice === question.type
          const isThisSelected = choice === selected
          let cls = 'nq-choice'
          if (selected !== null) {
            if (isThisSelected && isThisCorrect)  cls += ' nq-correct'
            else if (isThisSelected)              cls += ' nq-wrong'
            else if (isThisCorrect)               cls += ' nq-reveal'
          }
          return (
            <button key={choice} type="button" className={cls}
              onClick={() => handleAnswer(choice)} disabled={selected !== null}
              style={selected === null ? { borderLeftColor: TYPE_COLOR[choice], borderLeftWidth: 3 } : {}}>
              {choice}
            </button>
          )
        })}
      </div>

      <p className="nq-hint">
        V→I Authentic · IV→I Plagal · ends on V = Half · V→vi Deceptive
      </p>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function Cadences() {
  usePageTitle('Cadences')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Cadences</h1>
        <p className="tt-page-sub">
          The punctuation of music — how phrases begin, pause, and come to rest.
        </p>
      </div>
      <TheoryTopicLayout
        learnContent={<CadencesLearnContent />}
        gamesContent={<CadencesQuiz />}
        topicName="cadences"
        gamesLabel="Practice"
      />
    </div>
  )
}
