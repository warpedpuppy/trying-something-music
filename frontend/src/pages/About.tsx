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

          <h2>Privacy — your data never leaves your device</h2>
          <p>
            No account is required to use this site. The moment you arrive, you are
            automatically identified as <strong>"You"</strong> and your progress begins
            saving to your browser's local storage. That's it. Nothing more happens.
          </p>
          <p>
            <strong>No remote server ever learns anything about you from this site.</strong>{' '}
            Your rhythm level, your exercise attempts, your theory visits, your badges —
            every byte of that data is written directly to your own device and read back
            from your own device. There are no tracking pixels, no analytics scripts, no
            advertising networks, no accounts shared with third parties, no cookies sent
            to a server. The site does not make network requests to any backend. If you
            open your browser's developer tools and watch the network tab while you
            practice, you will see exactly zero requests carrying your data anywhere.
          </p>
          <p>
            The only trade-off to this approach is that if you clear your browser's local
            storage, your data is gone — there is no cloud backup because there is no
            cloud. That's the intentional price of keeping everything completely private.
          </p>
          <p>
            Nothing nefarious is going on. This is a music learning tool built by someone
            who believes your practice habits are your own business.
          </p>

          <h2>Multiple users on the same browser</h2>
          <p>
            If you share a browser with others and want to keep your progress separate,
            you can create a named profile from your{' '}
            <a href="/profile">profile page</a> (click "You" in the top navigation).
            Each named profile stores its own data locally using your chosen username as
            a label. <strong>There is no security threat in doing this</strong> — the
            password you choose never leaves your browser. It is hashed client-side and
            stored locally, purely to prevent one person from accidentally overwriting
            another person's data on the same device. No password is transmitted to any
            server, ever.
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
