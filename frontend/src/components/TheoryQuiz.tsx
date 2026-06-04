/**
 * TheoryQuiz — shared multiple-choice quiz shell for all theory practice tabs.
 *
 * Owns:  mode switching · score/streak tracking · correct-auto-advance timer ·
 *        wrong-answer Next button · choice-grid with correct/wrong/reveal states
 *
 * Each topic provides: modes, question picking, answer derivation, renderQuestion.
 *
 * Usage:
 *   <TheoryQuiz
 *     modes={[{ id: 'a', label: 'Mode A', pool: [...], hint: '...' }]}
 *     pickQuestion={(pool, excludeKey) => pick(pool, excludeKey)}
 *     getExcludeKey={(q) => q.id}
 *     pickChoices={(q, pool, modeId) => makeChoices(q, pool)}
 *     getAnswer={(q, modeId) => q.answer}
 *     renderQuestion={(q, modeId, selected, answer) => <QuestionCard ... />}
 *   />
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

// ── Public types ──────────────────────────────────────────────────────────────

export interface QuizMode<Q> {
  id: string
  label: string
  pool: Q[]
  hint?: string
}

export interface TheoryQuizProps<Q> {
  /** All available modes. Single-element array = no mode buttons rendered. */
  modes: QuizMode<Q>[]
  /** Active mode on mount. Defaults to modes[0].id. */
  defaultModeId?: string

  /** Pick a random question from pool; optionally skip the previous question. */
  pickQuestion: (pool: Q[], excludeKey?: string) => Q
  /** Unique string key of the current question — used to prevent immediate repeats. */
  getExcludeKey?: (q: Q) => string

  /** Build the four choice strings for a given question + mode. */
  pickChoices: (q: Q, pool: Q[], modeId: string) => string[]
  /** The correct answer string for a given question + mode. */
  getAnswer: (q: Q, modeId: string) => string

  /**
   * Render the question card.
   * Receives q, modeId, the currently selected choice (null = nothing picked yet),
   * and the correct answer string so the card can apply its own feedback styling.
   */
  renderQuestion: (
    q: Q,
    modeId: string,
    selected: string | null,
    answer: string,
  ) => ReactNode

  /**
   * Called inside a useEffect whenever the question or mode changes.
   * Use for audio autoplay or other side-effects.
   * May return a cleanup function.
   */
  onQuestionChange?: (q: Q, modeId: string) => (() => void) | void

  /**
   * Override for non-standard modes (e.g. Sing Along, technique browsers).
   * Return JSX to replace the score-strip + question + choices layout entirely,
   * or return null to fall through to the standard layout.
   */
  renderCustomMode?: (
    modeId: string,
    q: Q,
    advance: (excludeKey?: string) => void,
  ) => ReactNode | null

  /** ms before auto-advancing on a correct answer. Default 650. */
  correctDelayMs?: number

  /** Extra class on the nq-choices div (e.g. 'nq-choices--text'). */
  choicesClassName?: string

  /** Inline style on every choice button (e.g. { fontFamily: 'Georgia, serif' }). */
  choiceButtonStyle?: React.CSSProperties
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TheoryQuiz<Q>({
  modes,
  defaultModeId,
  pickQuestion,
  getExcludeKey,
  pickChoices,
  getAnswer,
  renderQuestion,
  onQuestionChange,
  renderCustomMode,
  correctDelayMs = 650,
  choicesClassName,
  choiceButtonStyle,
}: TheoryQuizProps<Q>) {
  const firstMode = modes[0]

  const [modeId, setModeId]    = useState(defaultModeId ?? firstMode.id)
  const mode                    = modes.find(m => m.id === modeId) ?? firstMode

  const [question, setQuestion] = useState<Q>(() => pickQuestion(mode.pool))
  const [choices, setChoices]   = useState<string[]>(() =>
    pickChoices(question, mode.pool, modeId),
  )
  const [selected, setSelected] = useState<string | null>(null)

  const [score, setScore]   = useState(0)
  const [total, setTotal]   = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest]     = useState(0)

  const timerRef    = useRef<number | null>(null)
  const modeIdRef   = useRef(modeId)
  modeIdRef.current = modeId

  // Side-effect hook — audio autoplay, etc.
  useEffect(() => {
    const cleanup = onQuestionChange?.(question, modeId)
    return cleanup ?? undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, modeId])

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const advance = useCallback((excludeKey?: string) => {
    const m           = modeIdRef.current
    const currentMode = modes.find(md => md.id === m) ?? modes[0]
    const q           = pickQuestion(currentMode.pool, excludeKey)
    setQuestion(q)
    setChoices(pickChoices(q, currentMode.pool, m))
    setSelected(null)
  }, [modes, pickQuestion, pickChoices])

  const switchMode = useCallback((newModeId: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const newMode = modes.find(m => m.id === newModeId) ?? modes[0]
    const q       = pickQuestion(newMode.pool)
    modeIdRef.current = newModeId
    setModeId(newModeId)
    setQuestion(q)
    setChoices(pickChoices(q, newMode.pool, newModeId))
    setSelected(null)
    setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [modes, pickQuestion, pickChoices])

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer  = getAnswer(question, modeIdRef.current)
    const correct = choice === answer
    setSelected(choice)
    setTotal(t => t + 1)
    if (correct) {
      setScore(s => s + 1)
      setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n })
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(
        () => advance(getExcludeKey?.(question)),
        correctDelayMs,
      )
    } else {
      setStreak(0)
    }
  }

  const answer   = getAnswer(question, modeId)
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  // ── Mode buttons (reused in both layouts) ─────────────────────────────────
  const modeBtns = modes.length > 1 ? (
    <div className="nq-mode-row">
      {modes.map(m => (
        <button
          key={m.id}
          type="button"
          className={`nq-mode-btn${modeId === m.id ? ' active' : ''}`}
          onClick={() => switchMode(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  ) : null

  // ── Custom-mode override ──────────────────────────────────────────────────
  if (renderCustomMode) {
    const custom = renderCustomMode(modeId, question, advance)
    if (custom !== null) {
      return (
        <div className="nq-root">
          {modeBtns}
          {custom}
        </div>
      )
    }
  }

  // ── Standard layout ───────────────────────────────────────────────────────
  return (
    <div className="nq-root">
      {modeBtns}

      {/* Score strip */}
      <div className="nq-score-row">
        <div className="nq-stat">
          <span className="nq-stat-value">
            {score}<span className="nq-stat-denom">/{total}</span>
          </span>
          <span className="nq-stat-label">correct</span>
        </div>
        {accuracy !== null && (
          <div className="nq-stat">
            <span className="nq-stat-value">{accuracy}%</span>
            <span className="nq-stat-label">accuracy</span>
          </div>
        )}
        <div className="nq-stat">
          <span className="nq-stat-value">
            {streak >= 3 ? `🔥 ${streak}` : streak}
          </span>
          <span className="nq-stat-label">
            streak{best > 0 ? ` (best ${best})` : ''}
          </span>
        </div>
      </div>

      {/* Question card */}
      {renderQuestion(question, modeId, selected, answer)}

      {/* Choices grid */}
      <div className={`nq-choices${choicesClassName ? ` ${choicesClassName}` : ''}`}>
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
            <button
              key={choice}
              type="button"
              className={cls}
              style={choiceButtonStyle}
              onClick={() => handleAnswer(choice)}
              disabled={selected !== null}
            >
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

      {/* Next button — only shown after a wrong answer */}
      {selected !== null && selected !== answer && (
        <button
          type="button"
          className="nq-next-btn"
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current)
            advance(getExcludeKey?.(question))
          }}
        >
          Next →
        </button>
      )}

      {/* Hint */}
      {mode.hint && <p className="nq-hint">{mode.hint}</p>}
    </div>
  )
}
