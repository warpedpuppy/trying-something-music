/**
 * TheoryTopicLayout — shared tab shell for every theory topic page.
 *
 * Renders two tabs: "Learn" (explanatory text) and a second tab whose
 * label is configurable (e.g. "Practice", "Explore").
 *
 * When the user navigates from the games/explore tab to the Learn tab via
 * the help link at the bottom of the games panel, a "← Back to [games]"
 * button appears at the top of the Learn panel so they can return easily.
 */

import type { ReactNode } from 'react'
import { useState } from 'react'

export type TheoryTab = 'learn' | 'games'

export interface TheoryTopicLayoutProps {
  /** Content for the "Learn" tab — text, diagrams, explanations. */
  learnContent: ReactNode
  /** Content for the interactive tab — quiz, explorer, etc. */
  gamesContent: ReactNode
  /** Which tab to show first. Defaults to 'games'. */
  defaultTab?: TheoryTab
  /** Used in the help prompt: "Need a refresher on {topicName}?" */
  topicName?: string
  /** Label for the second tab. Defaults to "Practice". */
  gamesLabel?: string
}

export function TheoryTopicLayout({
  learnContent,
  gamesContent,
  defaultTab = 'games',
  topicName = 'this topic',
  gamesLabel = 'Practice',
}: TheoryTopicLayoutProps) {
  const [tab, setTab] = useState<TheoryTab>(defaultTab)
  // True when the user clicked the help link from the games panel —
  // causes "← Back to [gamesLabel]" to appear in the Learn panel.
  const [cameFromGame, setCameFromGame] = useState(false)

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

  return (
    <div className="tt-layout">

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
      <div className="tt-tabs" role="tablist" aria-label="Topic sections">
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
