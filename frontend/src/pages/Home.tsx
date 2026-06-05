import { Link } from 'react-router-dom'
import { VexflowScrollingStaff } from '../components/VexflowScrollingStaff'

export function Home() {
  return (
    <div>
      {/* ── Play Along hero banner ─────────────────────────────────────────── */}
      <section className="pa-banner">
        {/* Staff animation fills the banner; CSS inverts it to white and masks to bottom */}
        <VexflowScrollingStaff silent />
        {/* Gradient: solid indigo at top (text readable), fades to transparent at bottom */}
        <div className="pa-banner-fade" aria-hidden="true" />
        <div className="pa-banner-content">
          <p className="pa-banner-eyebrow">Featured</p>
          <h2 className="pa-banner-title">Play Along</h2>
          <p className="pa-banner-desc">
            Sheet music scrolls past at a steady tempo — tap along and feel the rhythm.
            No score, no pressure. Just you and the beat.
          </p>
          <Link to="/rhythm/play-along" className="pa-banner-btn">
            Play now →
          </Link>
        </div>
      </section>

      {/* ── Section cards ─────────────────────────────────────────────────── */}
      <section className="section-chooser">
        <Link to="/rhythm/dashboard" className="section-card section-card-rhythm">
          <div className="section-card-icon">♩</div>
          <div>
            <h2>Rhythm Training</h2>
            <p>
              Sheet music scrolls past — you tap along and the app listens in real time.
              Eight progressive levels from whole notes to sixteenth-note syncopation.
            </p>
            <span className="section-card-cta">Go to dashboard →</span>
          </div>
        </Link>

        <Link to="/theory" className="section-card section-card-theory">
          <div className="section-card-icon">𝄞</div>
          <div>
            <h2>Music Theory</h2>
            <p>
              Twenty-plus interactive topics across three levels — from intervals and
              key signatures through counterpoint and jazz reharmonization.
            </p>
            <span className="section-card-cta">Explore theory →</span>
          </div>
        </Link>
      </section>

      <p className="home-footer-nudge">
        No account needed · all progress saved automatically in your browser
      </p>
    </div>
  )
}
