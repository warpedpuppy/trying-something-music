interface LogoProps {
  /** When true, renders the full logo including tagline and divider. */
  showTagline?: boolean
  height?: number
  className?: string
}

/**
 * The "trying something" brand mark as an inline SVG.
 * The wordmark fill uses `currentColor` so it adapts to light/dark contexts.
 * The icon arc colours are always purple.
 *
 * Layout: music-note icon on the left, "trying" / "something" stacked vertically.
 */
export function Logo({ showTagline = false, height = 38, className }: LogoProps) {
  const viewBox = showTagline ? '0 0 415 200' : '0 0 415 160'
  const aspectW = showTagline ? 415 / 200 : 415 / 160
  const width = Math.round(height * aspectW)

  return (
    <svg
      viewBox={viewBox}
      height={height}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="trying something"
      className={className}
    >
      {/* Icon: music note + signal arcs — translated so it sits left of the stacked text */}
      <g transform="translate(0, 28)">
        <rect x="28" y="10" width="4" height="60" rx="2" fill="#6C63FF" />
        <ellipse cx="24" cy="72" rx="12" ry="8" transform="rotate(-15,24,72)" fill="#6C63FF" />
        <path d="M 50 55 Q 65 40 50 25" stroke="#A78BFA" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 50 55 Q 78 32 50 10" stroke="#A78BFA" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65" />
        <path d="M 50 55 Q 92 22 50 -5" stroke="#A78BFA" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.35" />
      </g>

      {/* Wordmark — two lines, currentColor */}
      <text
        x="108" y="78"
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="800"
        fontSize="62"
        fill="currentColor"
        letterSpacing="-2"
      >
        trying
      </text>
      <text
        x="108" y="144"
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="800"
        fontSize="62"
        fill="currentColor"
        letterSpacing="-2"
      >
        something
      </text>

      {showTagline && (
        <>
          <text
            x="108" y="172"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="11"
            fill="#6C63FF"
            letterSpacing="4.5"
          >
            LEARN MUSIC. REWIRE YOUR BRAIN.
          </text>
          <line x1="108" y1="183" x2="410" y2="183" stroke="#6C63FF" strokeWidth="0.75" opacity="0.4" />
        </>
      )}
    </svg>
  )
}
