import { useState } from 'react'
import { VexflowScrollingStaff } from '../components/VexflowScrollingStaff'
import { BadgeItem } from '../components/BadgeItem'
import { BADGE_DEFS } from '../lib/badges'
import { usePageTitle } from '../hooks/usePageTitle'

type AboutTab = 'about' | 'badges'

export function About() {
  usePageTitle('About')
  const [tab, setTab] = useState<AboutTab>('about')

  return (
    <div>
      {/* Hero banner with music-note animation */}
      <section className="about-hero">
        <VexflowScrollingStaff silent />
        <div className="about-hero-text">
          <p className="about-tagline">Learn the basics of music.<br />Rewire your brain.</p>
        </div>
      </section>

      {/* Tab bar */}
      <div className="tt-tabs" role="tablist" aria-label="About sections" style={{ marginBottom: '28px' }}>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'about'}
          className={`tt-tab${tab === 'about' ? ' active' : ''}`}
          onClick={() => setTab('about')}
        >
          About
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'badges'}
          className={`tt-tab${tab === 'badges' ? ' active' : ''}`}
          onClick={() => setTab('badges')}
        >
          Badges
        </button>
      </div>

      {/* About tab */}
      {tab === 'about' && (
        <section className="about-body">
          <h2>Why this exists</h2>
          <p>
            A meaningful part of the social anxiety rising among people — the restlessness,
            the difficulty sitting quietly with oneself — comes from the gradual erosion of
            deep, patient attention. Social media addiction makes it worse: platforms are
            deliberately engineered to fragment focus, not build it. Music education asks for
            something different. To learn music, you have to count. You have to listen. You
            have to wait, and try again, and wait some more. Music teaches focus. Music
            teaches calm. This site is a small attempt to make that kind of learning a little
            more accessible — for anyone who wants it.
          </p>

          <h2>Privacy</h2>
          <p>
            Everything you do here is stored in your browser's local storage. Nothing is
            sent to a remote server. There are no tracking pixels, no analytics, no ads, no
            accounts shared with third parties. Your practice data belongs to you, on your
            device, period. If you clear your browser's local storage, your data is gone —
            that's the trade-off for keeping it simple and private.
          </p>
          <p>
            Nothing nefarious is going on. This is just a music learning tool built by
            someone who cares about focus, patience, and the joy of rhythm.
          </p>

          <h2>Multiple users</h2>
          <p>
            Each account you create is stored separately. More than one person can use the
            same browser — just sign up with a different username and your progress won't
            mix with anyone else's.
          </p>
        </section>
      )}

      {/* Badges tab */}
      {tab === 'badges' && (
        <section className="about-body">
          <h2 style={{ marginTop: 0 }}>Badge catalog</h2>
          <p>
            There are {BADGE_DEFS.length} badges to earn across rhythm training and music
            theory. Your progress is tracked automatically — no extra steps needed.
          </p>
          <div className="badge-grid about-badge-grid">
            {BADGE_DEFS.map(def => (
              <div key={def.id} className="about-badge-entry">
                <BadgeItem badge={{ ...def, earned: true, earnedAt: undefined }} alwaysEarned />
                <p className="about-badge-desc">{def.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
