import { Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { getTheoryCompletions } from '../../lib/localDb'
import { PRACTICE_REGISTRY } from '../../lib/theoryPracticeRegistry'
import { THEORY_LEVELS, THEORY_TOPIC_LABELS } from '../../lib/theoryTopics'
import { usePageTitle } from '../../hooks/usePageTitle'

const ORDERED_TOPICS = THEORY_LEVELS.flatMap(level =>
  level.slugs.map(slug => {
    return { slug, title: THEORY_TOPIC_LABELS[slug] ?? slug, levelName: level.name }
  })
)

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     '#16a34a',
  Intermediate: '#2563eb',
  Advanced:     '#9333ea',
}

export function TheoryPractice() {
  usePageTitle('Theory Practice')
  const { user } = useAuth()
  const completions = new Set(user ? getTheoryCompletions(user.id) : [])

  // Completed topics that have a quiz in the registry, in curriculum order
  const available = ORDERED_TOPICS.filter(
    t => completions.has(t.slug) && t.slug in PRACTICE_REGISTRY
  )

  const [selected, setSelected] = useState<string | null>(available[0]?.slug ?? null)

  const currentTopic = available.find(t => t.slug === selected)
  const QuizComponent = currentTopic ? PRACTICE_REGISTRY[currentTopic.slug] : null

  if (available.length === 0) {
    return (
      <div className="theory-practice-empty">
        <h2>Practice</h2>
        <p>
          As you complete the <strong>Learn</strong> section of each theory module, its
          practice exercises will appear here. You'll be able to return any time and drill
          any topic you've already studied — all in one place.
        </p>
        <p>
          To unlock practice for a topic, open it from the{' '}
          <Link to="/theory/beginner">Beginner</Link>,{' '}
          <Link to="/theory/intermediate">Intermediate</Link>, or{' '}
          <Link to="/theory/advanced">Advanced</Link> pages, read through the{' '}
          <strong>Learn</strong> tab, then click <strong>"I've completed this!"</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="theory-practice">
      {/* ── Topic picker ──────────────────────────────────────────────────── */}
      <div className="practice-topic-bar" role="tablist" aria-label="Practice topics">
        {available.map(t => (
          <button
            key={t.slug}
            role="tab"
            type="button"
            aria-selected={selected === t.slug}
            className={`practice-topic-chip${selected === t.slug ? ' active' : ''}`}
            style={selected === t.slug ? { borderColor: LEVEL_COLORS[t.levelName], color: LEVEL_COLORS[t.levelName] } : undefined}
            onClick={() => setSelected(t.slug)}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* ── Quiz area ─────────────────────────────────────────────────────── */}
      {QuizComponent && (
        <div className="practice-quiz-area" key={selected}>
          <div className="practice-quiz-header">
            <span
              className="practice-level-badge"
              style={{ color: LEVEL_COLORS[currentTopic!.levelName] }}
            >
              {currentTopic!.levelName}
            </span>
            <h2 className="practice-quiz-title">{currentTopic!.title}</h2>
            <Link
              to={`/theory/${currentTopic!.slug}`}
              className="practice-topic-link"
            >
              Open full topic →
            </Link>
          </div>
          <Suspense fallback={<p className="page-loading">Loading practice…</p>}>
            <QuizComponent />
          </Suspense>
        </div>
      )}
    </div>
  )
}
