/**
 * TheoryTopicLayout — shared tab shell for every theory topic page.
 *
 * Renders up to three tabs: optional "Overview" (leftmost, default when provided),
 * "Learn" (explanatory text), and a second interactive tab whose label is
 * configurable (e.g. "Practice", "Explore").
 *
 * When the user navigates from the games/explore tab to the Learn tab via
 * the help link at the bottom of the games panel, a "← Back to [games]"
 * button appears at the top of the Learn panel so they can return easily.
 */

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getTheoryCompletions, markTheoryComplete } from '../lib/localDb'
import { THEORY_LEVELS } from '../lib/theoryTopics'

export type TheoryTab = 'overview' | 'learn' | 'games'

export interface TheoryTopicLayoutProps {
  /** Optional content for the "Overview" tab — animation, intro, etc. Leftmost tab; default when provided. */
  overviewContent?: ReactNode
  /** Content for the "Learn" tab — text, diagrams, explanations. */
  learnContent: ReactNode
  /** Content for the interactive tab — quiz, explorer, etc. */
  gamesContent: ReactNode
  /** Which tab to show first. Defaults to 'overview' when overviewContent is set, else 'games'. */
  defaultTab?: TheoryTab
  /** Used in the help prompt: "Need a refresher on {topicName}?" */
  topicName?: string
  /** Label for the second tab. Defaults to "Practice". */
  gamesLabel?: string
}

export function TheoryTopicLayout({
  overviewContent,
  learnContent,
  gamesContent,
  defaultTab,
  topicName = 'this topic',
  gamesLabel = 'Practice',
}: TheoryTopicLayoutProps) {
  const resolvedDefault: TheoryTab =
    defaultTab ?? (overviewContent ? 'overview' : 'games')

  const [tab, setTab] = useState<TheoryTab>(resolvedDefault)
  // True when the user clicked the help link from the games panel —
  // causes "← Back to [gamesLabel]" to appear in the Learn panel.
  const [cameFromGame, setCameFromGame] = useState(false)

  const { user } = useAuth()
  const slug = useLocation().pathname.split('/').pop() ?? ''
  const [completed, setCompleted] = useState<boolean>(() =>
    user ? getTheoryCompletions(user.id).includes(slug) : false
  )

  const levelRecord = THEORY_LEVELS.find(l => l.slugs.includes(slug))
  const backHref = levelRecord ? `/theory/${levelRecord.name.toLowerCase()}` : '/theory'
  const backLabel = levelRecord ? levelRecord.name : 'Theory'

  function handleMarkComplete() {
    if (!user || !slug) return
    markTheoryComplete(user.id, slug)
    setCompleted(true)
  }

  function openLearnFromGame() {
    setCameFromGame(true)
    setTab('learn')
  }

  function openLearnDirectly() {
    setCameFromGame(false)
    setTab('learn')
  }

  function openGames() {
    setCameFromGame(false)
    setTab('games')
  }

  function openOverview() {
    setCameFromGame(false)
    setTab('overview')
  }

  return (
    <div className="tt-layout">

      {/* ── Back to level ─────────────────────────────────────────────── */}
      <Link to={backHref} className="tt-level-back">
        ← {backLabel}
      </Link>

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
      <div className="tt-tabs" role="tablist" aria-label="Topic sections">
        {overviewContent && (
          <button
            role="tab"
            type="button"
            aria-selected={tab === 'overview'}
            className={`tt-tab${tab === 'overview' ? ' active' : ''}`}
            onClick={openOverview}
          >
            Overview
          </button>
        )}
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'learn'}
          className={`tt-tab${tab === 'learn' ? ' active' : ''}`}
          onClick={openLearnDirectly}
        >
          Learn
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'games'}
          className={`tt-tab${tab === 'games' ? ' active' : ''}`}
          onClick={openGames}
        >
          {gamesLabel}
        </button>
      </div>

      {/* ── Overview panel ────────────────────────────────────────────── */}
      {tab === 'overview' && overviewContent && (
        <div role="tabpanel" className="tt-panel tt-panel-overview">
          {overviewContent}
        </div>
      )}

      {/* ── Learn panel ───────────────────────────────────────────────── */}
      {tab === 'learn' && (
        <div role="tabpanel" className="tt-panel">
          {cameFromGame && (
            <button type="button" className="tt-back-btn" onClick={openGames}>
              ← Back to {gamesLabel.toLowerCase()}
            </button>
          )}
          <div className="tt-learn-body">
            {learnContent}
          </div>
          {user && (
            <div className="tt-completion">
              {completed ? (
                <div className="tt-completed-badge">
                  <span className="tt-completed-check">✓</span>
                  I've completed this!
                </div>
              ) : (
                <button type="button" className="tt-complete-btn" onClick={handleMarkComplete}>
                  I've completed this!
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Games / explore panel ─────────────────────────────────────── */}
      {tab === 'games' && (
        <div role="tabpanel" className="tt-panel">
          {gamesContent}
          <div className="tt-help-row">
            <button type="button" className="tt-help-link" onClick={openLearnFromGame}>
              📖 Need a refresher on {topicName}? → Learn tab
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
