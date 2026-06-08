import { useState } from "react";
import { VexflowScrollingStaff } from "../components/VexflowScrollingStaff";
import { BadgeItem } from "../components/BadgeItem";
import { BADGE_DEFS } from "../lib/badges";
import { usePageTitle } from "../hooks/usePageTitle";
import { SHOW_THEORY } from "../lib/featureFlags";

type AboutTab = "about" | "badges" | "maker";

export function About() {
  usePageTitle("About", "About Trying Something — a free rhythm trainer that keeps all your practice data private on your own device.");
  const [tab, setTab] = useState<AboutTab>("about");

  return (
    <div>
      {/* Hero banner with music-note animation */}
      <section className="about-hero">
        <VexflowScrollingStaff silent />
        <div className="about-hero-text">
          <p className="about-tagline">
            Learn to read rhythm.
            <br />
            It can't hurt.
          </p>
        </div>
      </section>

      {/* Tab bar */}
      <div
        className="tt-tabs"
        role="tablist"
        aria-label="About sections"
        style={{ marginBottom: "28px" }}
      >
        <button
          role="tab"
          type="button"
          aria-selected={tab === "about"}
          className={`tt-tab${tab === "about" ? " active" : ""}`}
          onClick={() => setTab("about")}
        >
          About
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "badges"}
          className={`tt-tab${tab === "badges" ? " active" : ""}`}
          onClick={() => setTab("badges")}
        >
          Badges
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "maker"}
          className={`tt-tab${tab === "maker" ? " active" : ""}`}
          onClick={() => setTab("maker")}
        >
          Who made this
        </button>
      </div>

      {/* About tab */}
      {tab === "about" && (
        <section className="about-body">
          <h2>Why this exists</h2>
          <p>
            Learning music takes patience — you have to count, listen, wait, and
            try again. That turns out to be good for you. This site is a small
            tool to help with the basics.
          </p>

          <h2>Privacy — your practice data never leaves your device</h2>
          <p>
            No account is required to use this site. The moment you arrive, you
            are automatically identified as <strong>"You"</strong> and your
            progress begins saving to your browser's local storage. That's it.
            Nothing more happens.
          </p>
          <p>
            <strong>
              Your rhythm level, exercise attempts, and badges{SHOW_THEORY && ', and theory visits'} are
              stored only on your device.
            </strong>{" "}
            No remote server ever receives any of that data. There are no
            advertising networks, no accounts shared with third parties, and no
            backend that touches your practice history. If you clear your
            browser's local storage, your data is gone — there is no cloud
            backup because there is no cloud.
          </p>
          <p>
            <strong>One exception: Google Analytics.</strong> Like most
            websites, this site uses Google Analytics to collect anonymous
            traffic data — which pages are visited, roughly where visitors are
            coming from, and what devices they use. This helps us understand
            how the site is being used, but it contains nothing about your
            practice. Your taps, your rhythm level, your badges — none of that
            is ever included. Google Analytics uses a cookie and sends
            anonymised page-view data to Google. If you use an ad blocker
            that blocks Google Analytics, the site works exactly the same.
          </p>
          <p>
            Nothing nefarious is going on. This is a music learning tool built
            by someone who believes your practice habits are your own business.
          </p>

          <h2>Multiple users on the same browser</h2>
          <p>
            If you share a browser with others and want to keep your progress
            separate, you can create a named profile from your{" "}
            <a href="/profile">profile page</a> (click "You" in the top
            navigation). Each named profile stores its own data locally using
            your chosen username as a label. There is no password — there is no
            data here important enough to need one. Your name is just a label,
            stored entirely on your own device.
          </p>
        </section>
      )}

      {/* Badges tab */}
      {tab === "badges" && (
        <section className="about-body">
          {(() => {
            const visibleBadges = SHOW_THEORY
              ? BADGE_DEFS
              : BADGE_DEFS.filter(d => !d.id.startsWith('theory-'))
            return (
              <>
                <h2 style={{ marginTop: 0 }}>Badge catalog</h2>
                <p>
                  There are {visibleBadges.length} badges to earn. Your progress
                  is tracked automatically — no extra steps needed.
                </p>
                <div className="badge-grid about-badge-grid">
                  {visibleBadges.map((def) => (
                    <div key={def.id} className="about-badge-entry">
                      <BadgeItem
                        badge={{ ...def, earned: true, earnedAt: undefined }}
                        alwaysEarned
                      />
                      <p className="about-badge-desc">{def.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </section>
      )}

      {/* Who made this tab */}
      {tab === "maker" && (
        <section className="about-body">
          <h2 style={{ marginTop: 0 }}>Who made this</h2>
          <p>
            <strong>Ted Walther</strong> — developer, designer, piano and
            classical guitar player (both a work in progress).
          </p>
          <p>
            Ted loves music. Ted loves coding. Hence this site.
          </p>
          <p>
            More at{" "}
            <a
              href="https://warpedpuppy.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              warpedpuppy.com
            </a>
            .
          </p>
        </section>
      )}
    </div>
  );
}
