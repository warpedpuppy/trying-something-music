/**
 * Voice Leading — theory topic page.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

type MotionType = 'Parallel' | 'Contrary' | 'Oblique' | 'Similar'

interface MotionExample {
  bottom: [string, string]   // [from, to]
  top: [string, string]
  motion: MotionType
  interval: string           // e.g. "parallel 5ths"
}

const MOTION_EXAMPLES: MotionExample[] = [
  { bottom: ['C', 'D'], top: ['G', 'A'], motion: 'Parallel', interval: 'parallel 5ths' },
  { bottom: ['C', 'D'], top: ['G', 'F'], motion: 'Contrary', interval: 'contrary motion' },
  { bottom: ['C', 'C'], top: ['E', 'F'], motion: 'Oblique', interval: 'oblique motion' },
  { bottom: ['C', 'D'], top: ['G', 'B'], motion: 'Similar', interval: 'similar motion' },
  { bottom: ['G', 'A'], top: ['D', 'E'], motion: 'Parallel', interval: 'parallel 5ths' },
  { bottom: ['F', 'G'], top: ['C', 'B'], motion: 'Contrary', interval: 'contrary motion' },
  { bottom: ['D', 'D'], top: ['A', 'B'], motion: 'Oblique', interval: 'oblique motion' },
  { bottom: ['E', 'F'], top: ['B', 'D'], motion: 'Similar', interval: 'similar motion' },
  { bottom: ['G', 'A'], top: ['G', 'A'], motion: 'Parallel', interval: 'parallel octaves' },
  { bottom: ['A', 'G'], top: ['D', 'E'], motion: 'Contrary', interval: 'contrary motion' },
  { bottom: ['B', 'C'], top: ['G', 'G'], motion: 'Oblique', interval: 'oblique motion' },
  { bottom: ['F', 'G'], top: ['C', 'E'], motion: 'Similar', interval: 'similar motion' },
]

const MOTION_TYPES: MotionType[] = ['Parallel', 'Contrary', 'Oblique', 'Similar']
const MOTION_DESC: Record<MotionType, string> = {
  Parallel: 'Both voices move in the same direction by the same interval.',
  Contrary: 'The voices move in opposite directions.',
  Oblique: 'One voice stays on the same note while the other moves.',
  Similar: 'Both voices move in the same direction but by different intervals.',
}

// ── VL RULES quiz ─────────────────────────────────────────────────────────────

interface RuleQuestion {
  question: string
  answer: string
  choices: string[]
  explanation: string
}

const RULE_QUESTIONS: RuleQuestion[] = [
  {
    question: 'Two voices both leap to a perfect 5th in the same direction. This is called…',
    answer: 'Parallel 5ths',
    choices: ['Parallel 5ths', 'Contrary 5ths', 'Oblique motion', 'Voice crossing'],
    explanation: 'Parallel 5ths (and octaves) are generally avoided in classical voice leading because they merge two voices into one perceptual stream.',
  },
  {
    question: 'Which type of motion is generally considered the strongest and most independent?',
    answer: 'Contrary motion',
    choices: ['Contrary motion', 'Parallel motion', 'Oblique motion', 'Similar motion'],
    explanation: 'Contrary motion — voices moving in opposite directions — maximises independence and is the most prized in classical counterpoint.',
  },
  {
    question: 'The leading tone (degree 7) of a major scale should typically resolve…',
    answer: 'Up by a half step to the tonic',
    choices: ['Up by a half step to the tonic', 'Down by a whole step', 'Down by a 3rd', 'Stay in place'],
    explanation: 'The leading tone has a strong gravitational pull upward to the tonic. Failing to resolve it creates a sense of incompleteness.',
  },
  {
    question: 'The 7th of a dominant 7th chord (e.g. F in G7) should typically resolve…',
    answer: 'Down by a step',
    choices: ['Down by a step', 'Up by a step', 'By a leap of a 4th', 'Stay in place'],
    explanation: 'The 7th is a dissonant note that creates tension — it naturally resolves downward by step when the chord moves to the tonic.',
  },
  {
    question: 'Avoiding large leaps and preferring stepwise motion in each voice is called…',
    answer: 'Smooth voice leading',
    choices: ['Smooth voice leading', 'Stretto', 'Voice crossing', 'Augmentation'],
    explanation: 'Smooth voice leading keeps each part singable and easy to follow. It underpins everything from Bach chorales to jazz piano voicings.',
  },
  {
    question: 'When a lower voice moves higher than an upper voice it is called…',
    answer: 'Voice crossing',
    choices: ['Voice crossing', 'Parallel motion', 'Voice exchange', 'Elision'],
    explanation: 'Voice crossing is generally avoided because it obscures the independence of the parts and can sound muddy.',
  },
  {
    question: 'Common tones (notes shared between two consecutive chords) should generally…',
    answer: 'Be held in the same voice',
    choices: ['Be held in the same voice', 'Always leap by a 4th', 'Be inverted', 'Be doubled in another voice'],
    explanation: 'Keeping a common tone in the same voice is the easiest way to achieve smooth voice leading — one voice stays put while others move.',
  },
  {
    question: 'Which interval is generally considered safest to approach by parallel motion?',
    answer: 'A 3rd or 6th',
    choices: ['A 3rd or 6th', 'A perfect 5th', 'An octave', 'A 7th'],
    explanation: 'Parallel 3rds and 6ths are acceptable and common. Parallel perfect intervals (5ths, octaves) are avoided in strict style.',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is voice leading?</h2>
        <p>
          <strong>Voice leading</strong> describes how individual melodic lines (called "voices") move
          from one chord to the next. Good voice leading makes a chord progression feel smooth and inevitable —
          each part has its own logical motion, and all parts work together without clashing.
        </p>
        <p>
          The term comes from choral music (soprano, alto, tenor, bass) but applies equally to
          piano voicings, guitar chord grips, string quartet writing, and jazz arrangements.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The four types of motion</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '1fr 2fr' }}>
            <span>Type</span><span>Description</span>
          </div>
          {MOTION_TYPES.map(m => (
            <div key={m} className="tt-sig-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
              <span className="tt-sig-key">{m}</span>
              <span className="tt-sig-notes">{MOTION_DESC[m]}</span>
            </div>
          ))}
        </div>
        <p className="tt-learn-tip">
          💡 Contrary motion is the gold standard — it preserves each voice's independence. Parallel motion
          (especially parallel 5ths and octaves) is restricted in classical style because it makes two voices
          sound like one.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The core rules</h2>
        <ul className="tt-learn-list">
          <li><strong>Avoid parallel 5ths and octaves.</strong> Two voices that move in parallel to a perfect 5th or octave lose their independence — they blur into one sonic line.</li>
          <li><strong>Resolve tendency tones.</strong> The leading tone (scale degree 7) pulls upward to the tonic; the 7th of a dominant chord pulls downward by step.</li>
          <li><strong>Keep common tones.</strong> When two chords share a note, hold it in the same voice — this creates a seamless connection.</li>
          <li><strong>Prefer stepwise motion.</strong> Large leaps (especially in inner voices) can sound awkward. Move by step whenever possible; keep leaps for outer voices.</li>
          <li><strong>Avoid voice crossing.</strong> Each voice should stay in its own register — soprano above alto, alto above tenor, etc.</li>
        </ul>
      </section>

      <section className="tt-learn-section">
        <h2>Why does it matter?</h2>
        <p>
          Even if you never write a Bach chorale, voice-leading awareness improves every musical skill.
          A jazz pianist who thinks in voice leading writes smoother chord transitions.
          A guitarist who considers voice leading finds better inversions.
          An arranger who understands voice leading creates textures that feel effortless, not rigid.
        </p>
        <p>
          Ultimately, voice leading is about the <em>melody inside the harmony</em> —
          every note of every chord can be heard as part of its own melodic journey.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

type VLMode = 'motion-type' | 'rules'

function motionChoices(): string[] {
  return [...MOTION_TYPES].sort(() => Math.random() - 0.5)
}

function pickExample(excludeMotion?: MotionType): MotionExample {
  const pool = excludeMotion
    ? MOTION_EXAMPLES.filter(e => e.motion !== excludeMotion)
    : MOTION_EXAMPLES
  return pool[Math.floor(Math.random() * pool.length)]
}

function pickRuleQ(excludeQ?: string): RuleQuestion {
  const pool = excludeQ ? RULE_QUESTIONS.filter(q => q.question !== excludeQ) : RULE_QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

function Quiz() {
  const [mode, setMode] = useState<VLMode>('motion-type')
  const [example, setExample] = useState<MotionExample>(() => pickExample())
  const [ruleQ, setRuleQ] = useState<RuleQuestion>(() => pickRuleQ())
  const [choices, setChoices] = useState<string[]>(() => motionChoices())
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const timerRef = useRef<number | null>(null)
  const modeRef = useRef<VLMode>('motion-type')
  modeRef.current = mode

  const switchMode = useCallback((m: VLMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    modeRef.current = m
    const ex = pickExample()
    const rq = pickRuleQ()
    setMode(m); setExample(ex); setRuleQ(rq)
    setChoices(m === 'motion-type' ? motionChoices() : [...rq.choices].sort(() => Math.random() - 0.5))
    setSelected(null); setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance() {
    const m = modeRef.current
    if (m === 'motion-type') {
      const ex = pickExample()
      setExample(ex); setChoices(motionChoices()); setSelected(null)
    } else {
      const rq = pickRuleQ(ruleQ.question)
      setRuleQ(rq)
      setChoices([...rq.choices].sort(() => Math.random() - 0.5))
      setSelected(null)
    }
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = modeRef.current === 'motion-type' ? example.motion : ruleQ.answer
    const correct = choice === answer
    setSelected(choice); setTotal(t => t + 1)
    if (correct) { setScore(s => s + 1); setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n }) }
    else setStreak(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(advance, correct ? 650 : 1500)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer = mode === 'motion-type' ? example.motion : ruleQ.answer
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  return (
    <div className="nq-root">
      <div className="nq-mode-row">
        <button type="button" className={`nq-mode-btn${mode === 'motion-type' ? ' active' : ''}`} onClick={() => switchMode('motion-type')}>Motion Types</button>
        <button type="button" className={`nq-mode-btn${mode === 'rules' ? ' active' : ''}`} onClick={() => switchMode('rules')}>Rules & Principles</button>
      </div>
      <div className="nq-score-row">
        <div className="nq-stat"><span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span><span className="nq-stat-label">correct</span></div>
        {accuracy !== null && <div className="nq-stat"><span className="nq-stat-value">{accuracy}%</span><span className="nq-stat-label">accuracy</span></div>}
        <div className="nq-stat"><span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span><span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span></div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        {mode === 'motion-type' ? (
          <>
            <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}>
              Bass: {example.bottom[0]} → {example.bottom[1]}<br />
              <span style={{ color: '#6c7a8d' }}>Treble: {example.top[0]} → {example.top[1]}</span>
            </div>
            <div className="theory-q-sub">What type of voice motion is this?</div>
          </>
        ) : (
          <>
            <div className="theory-q-sub" style={{ fontSize: '1rem', textAlign: 'center', padding: '0 8px' }}>{ruleQ.question}</div>
            {selected !== null && (
              <div className="theory-q-sub" style={{ marginTop: 10, fontSize: '0.85rem', color: '#555' }}>{ruleQ.explanation}</div>
            )}
          </>
        )}
      </div>

      <div className="nq-choices">
        {choices.map(choice => {
          const isCorrect = choice === answer; const isSelected = choice === selected
          let cls = 'nq-choice'
          if (selected !== null) { if (isSelected && isCorrect) cls += ' nq-correct'; else if (isSelected) cls += ' nq-wrong'; else if (isCorrect) cls += ' nq-reveal' }
          return <button key={choice} type="button" className={cls} onClick={() => handleAnswer(choice)} disabled={selected !== null}>{choice}</button>
        })}
      </div>
      <p className="nq-hint">Parallel = same direction & interval · Contrary = opposite · Oblique = one holds · Similar = same direction, diff interval</p>
    </div>
  )
}

export function VoiceLeading() {
  usePageTitle('Voice Leading')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Voice Leading</h1>
        <p className="tt-page-sub">The invisible logic that makes chord progressions feel smooth — how individual voices move between chords.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="↕️"
          title="Voice Leading"
          description="Voice leading is the art of moving smoothly from one chord to the next. Good voice leading minimises the distance each voice travels, creating a seamless flow. It is why some chord progressions feel natural and others feel clunky."
          keyFact="The leading tone (7th scale degree) has a strong tendency to resolve up a half-step to the tonic. Voice leading is really about managing these melodic tendencies."
          color="hsl(260, 60%, 50%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<Quiz />}
        topicName="voice leading"
        gamesLabel="Practice"
      />
    </div>
  )
}
