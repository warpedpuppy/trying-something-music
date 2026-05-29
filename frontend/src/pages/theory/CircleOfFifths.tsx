import { useState } from 'react'

// ── Data ──────────────────────────────────────────────────────────────────────

const SHARP_NOTES = ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯']
const FLAT_NOTES  = ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭']

function sigNotes(n: number): string {
  if (n === 0) return 'none'
  if (n > 0) return SHARP_NOTES.slice(0, n).join(', ')
  return FLAT_NOTES.slice(0, -n).join(', ')
}

interface KeyInfo {
  major: string
  minor: string
  sf: number        // positive = sharps, negative = flats
  sfLabel: string   // "2♯" | "3♭" | "—"
  sfNotes: string   // "F♯, C♯" | "none"
  diatonic: string[]
}

// 12 keys clockwise from C at top
const KEYS: KeyInfo[] = [
  { major: 'C',  minor: 'Am',  sf:  0, sfLabel: '—',     sfNotes: sigNotes(0),
    diatonic: ['C',  'Dm',  'Em',  'F',  'G',  'Am',  'B°']   },
  { major: 'G',  minor: 'Em',  sf:  1, sfLabel: '1♯',    sfNotes: sigNotes(1),
    diatonic: ['G',  'Am',  'Bm',  'C',  'D',  'Em',  'F♯°']  },
  { major: 'D',  minor: 'Bm',  sf:  2, sfLabel: '2♯',    sfNotes: sigNotes(2),
    diatonic: ['D',  'Em',  'F♯m', 'G',  'A',  'Bm',  'C♯°']  },
  { major: 'A',  minor: 'F♯m', sf:  3, sfLabel: '3♯',    sfNotes: sigNotes(3),
    diatonic: ['A',  'Bm',  'C♯m', 'D',  'E',  'F♯m', 'G♯°']  },
  { major: 'E',  minor: 'C♯m', sf:  4, sfLabel: '4♯',    sfNotes: sigNotes(4),
    diatonic: ['E',  'F♯m', 'G♯m', 'A',  'B',  'C♯m', 'D♯°']  },
  { major: 'B',  minor: 'G♯m', sf:  5, sfLabel: '5♯',    sfNotes: sigNotes(5),
    diatonic: ['B',  'C♯m', 'D♯m', 'E',  'F♯', 'G♯m', 'A♯°']  },
  { major: 'F♯', minor: 'D♯m', sf:  6, sfLabel: '6♯/6♭', sfNotes: sigNotes(6),
    diatonic: ['F♯', 'G♯m', 'A♯m', 'B',  'C♯', 'D♯m', 'E♯°']  },
  { major: 'D♭', minor: 'B♭m', sf: -5, sfLabel: '5♭',    sfNotes: sigNotes(-5),
    diatonic: ['D♭', 'E♭m', 'Fm',  'G♭', 'A♭', 'B♭m', 'C°']   },
  { major: 'A♭', minor: 'Fm',  sf: -4, sfLabel: '4♭',    sfNotes: sigNotes(-4),
    diatonic: ['A♭', 'B♭m', 'Cm',  'D♭', 'E♭', 'Fm',  'G°']   },
  { major: 'E♭', minor: 'Cm',  sf: -3, sfLabel: '3♭',    sfNotes: sigNotes(-3),
    diatonic: ['E♭', 'Fm',  'Gm',  'A♭', 'B♭', 'Cm',  'D°']   },
  { major: 'B♭', minor: 'Gm',  sf: -2, sfLabel: '2♭',    sfNotes: sigNotes(-2),
    diatonic: ['B♭', 'Cm',  'Dm',  'E♭', 'F',  'Gm',  'A°']   },
  { major: 'F',  minor: 'Dm',  sf: -1, sfLabel: '1♭',    sfNotes: sigNotes(-1),
    diatonic: ['F',  'Gm',  'Am',  'B♭', 'C',  'Dm',  'E°']   },
]

const ROMAN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']

// ── SVG geometry ──────────────────────────────────────────────────────────────

const CX = 280, CY = 280
const R_OUTER = 254   // outer edge of major ring
const R_MID   = 188   // major / minor boundary
const R_INNER = 126   // inner edge of minor ring

const STEP = (2 * Math.PI) / 12
const midAngle = (i: number) => -Math.PI / 2 + i * STEP
const px = (r: number, a: number) => CX + r * Math.cos(a)
const py = (r: number, a: number) => CY + r * Math.sin(a)

function wedge(r1: number, r2: number, i: number, gap = 0.018): string {
  const a0 = midAngle(i) - STEP / 2 + gap
  const a1 = midAngle(i) + STEP / 2 - gap
  return [
    `M ${px(r1, a0).toFixed(2)} ${py(r1, a0).toFixed(2)}`,
    `L ${px(r2, a0).toFixed(2)} ${py(r2, a0).toFixed(2)}`,
    `A ${r2} ${r2} 0 0 1 ${px(r2, a1).toFixed(2)} ${py(r2, a1).toFixed(2)}`,
    `L ${px(r1, a1).toFixed(2)} ${py(r1, a1).toFixed(2)}`,
    `A ${r1} ${r1} 0 0 0 ${px(r1, a0).toFixed(2)} ${py(r1, a0).toFixed(2)}`,
    'Z',
  ].join(' ')
}

// Each key gets a unique hue spaced evenly around the colour wheel
const hue = (i: number) => i * 30

type SegState = 'default' | 'hover' | 'selected'

function majorFill(i: number, s: SegState) {
  const h = hue(i)
  if (s === 'selected') return `hsl(${h},70%,50%)`
  if (s === 'hover')    return `hsl(${h},58%,72%)`
  return                       `hsl(${h},44%,84%)`
}
function minorFill(i: number, s: SegState) {
  const h = hue(i)
  if (s === 'selected') return `hsl(${h},55%,65%)`
  if (s === 'hover')    return `hsl(${h},40%,78%)`
  return                       `hsl(${h},28%,91%)`
}
function labelColor(s: SegState) {
  return s === 'selected' ? 'white' : '#1c1c1c'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CircleOfFifths() {
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered,  setHovered]  = useState<number | null>(null)

  function segState(i: number): SegState {
    if (i === selected) return 'selected'
    if (i === hovered)  return 'hover'
    return 'default'
  }

  function toggle(i: number) {
    setSelected(s => s === i ? null : i)
  }

  const key = selected !== null ? KEYS[selected] : null
  const selectedHue = selected !== null ? hue(selected) : 220

  return (
    <div className="cof-page">
      <div className="cof-header">
        <h1>Circle of Fifths</h1>
        <p className="cof-intro">
          Every adjacent pair of keys on this circle is a perfect fifth apart — the
          most consonant interval after the octave. Keys closest together share the
          most notes; keys directly opposite share the fewest. Click any wedge to
          explore its signature, relative minor, and the seven diatonic chords that
          live inside it.
        </p>
      </div>

      <div className="cof-layout">

        {/* ── SVG circle ── */}
        <div className="cof-circle-wrap">
          <svg
            viewBox="0 0 560 560"
            className="cof-svg"
            aria-label="Circle of fifths — click a key to explore"
          >
            {KEYS.map((k, i) => {
              const s   = segState(i)
              const ang = midAngle(i)
              const rMajText = (R_OUTER + R_MID) / 2        // 221
              const rSigText = R_MID + 16                    // 204 (bottom of major ring)
              const rMinText = (R_MID + R_INNER) / 2        // 157

              return (
                <g
                  key={i}
                  onClick={() => toggle(i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  aria-label={`${k.major} major / ${k.minor} minor`}
                  aria-pressed={i === selected}
                >
                  {/* Major wedge */}
                  <path
                    d={wedge(R_MID, R_OUTER, i)}
                    fill={majorFill(i, s)}
                    stroke="white"
                    strokeWidth="2.5"
                    style={{ transition: 'fill 0.14s' }}
                  />
                  <text
                    x={px(rMajText, ang).toFixed(1)}
                    y={py(rMajText, ang).toFixed(1)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="17"
                    fontWeight="700"
                    fontFamily="Georgia, serif"
                    fill={labelColor(s)}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {k.major}
                  </text>
                  <text
                    x={px(rSigText, ang).toFixed(1)}
                    y={py(rSigText, ang).toFixed(1)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fontFamily="system-ui, sans-serif"
                    fill={s === 'selected' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.4)'}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {k.sfLabel}
                  </text>

                  {/* Minor wedge */}
                  <path
                    d={wedge(R_INNER, R_MID, i)}
                    fill={minorFill(i, s)}
                    stroke="white"
                    strokeWidth="2.5"
                    style={{ transition: 'fill 0.14s' }}
                  />
                  <text
                    x={px(rMinText, ang).toFixed(1)}
                    y={py(rMinText, ang).toFixed(1)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="12"
                    fontWeight="600"
                    fontFamily="Georgia, serif"
                    fill={labelColor(s)}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {k.minor}
                  </text>
                </g>
              )
            })}

            {/* Centre disc */}
            <circle cx={CX} cy={CY} r={R_INNER - 10} fill="white" stroke="#e5e7eb" strokeWidth="1.5" />

            {key ? (
              <>
                <text x={CX} y={CY - 26} textAnchor="middle" dominantBaseline="central"
                  fontSize="38" fontWeight="800" fontFamily="Georgia, serif"
                  fill={`hsl(${selectedHue},60%,38%)`}
                >
                  {key.major}
                </text>
                <text x={CX} y={CY + 8} textAnchor="middle" dominantBaseline="central"
                  fontSize="11" letterSpacing="0.06em"
                  fontFamily="system-ui, sans-serif" fill="#888"
                >
                  MAJOR
                </text>
                <text x={CX} y={CY + 32} textAnchor="middle" dominantBaseline="central"
                  fontSize="15" fontWeight="600" fontFamily="Georgia, serif"
                  fill={`hsl(${selectedHue},45%,52%)`}
                >
                  {key.minor}
                </text>
                <text x={CX} y={CY + 52} textAnchor="middle" dominantBaseline="central"
                  fontSize="9" fontFamily="system-ui, sans-serif" fill="#bbb"
                >
                  relative minor
                </text>
              </>
            ) : (
              <>
                <text x={CX} y={CY - 8} textAnchor="middle" dominantBaseline="central"
                  fontSize="13" fontFamily="system-ui, sans-serif" fill="#bbb"
                >
                  click any key
                </text>
                <text x={CX} y={CY + 12} textAnchor="middle" dominantBaseline="central"
                  fontSize="13" fontFamily="system-ui, sans-serif" fill="#bbb"
                >
                  to explore
                </text>
              </>
            )}
          </svg>

          {/* Compass labels */}
          <div className="cof-compass">
            <span className="cof-compass-flat">← more flats</span>
            <span className="cof-compass-sharp">more sharps →</span>
          </div>
        </div>

        {/* ── Info panel ── */}
        <div className="cof-info">
          {key ? (
            <>
              <h2
                className="cof-key-title"
                style={{ color: `hsl(${selectedHue},60%,36%)` }}
              >
                {key.major} Major
              </h2>

              <div className="cof-info-rows">
                <div className="cof-info-row">
                  <span className="cof-info-label">Key signature</span>
                  <span className="cof-info-value">
                    {key.sf === 0 ? 'No sharps or flats' : key.sfNotes}
                  </span>
                </div>
                <div className="cof-info-row">
                  <span className="cof-info-label">Sharps / flats</span>
                  <span className="cof-info-value">
                    {key.sf === 0 ? '—'
                      : key.sf > 0 ? `${key.sf} sharp${key.sf > 1 ? 's' : ''}`
                      : `${-key.sf} flat${-key.sf > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="cof-info-row">
                  <span className="cof-info-label">Relative minor</span>
                  <span
                    className="cof-info-value cof-info-clickable"
                    title="Shares the same key signature"
                  >
                    {key.minor}
                  </span>
                </div>
              </div>

              <p className="cof-section-label">Diatonic chords</p>
              <div className="cof-chords">
                {ROMAN.map((roman, j) => (
                  <div
                    key={j}
                    className="cof-chord-cell"
                    style={j === 0 || j === 3 || j === 4
                      ? { background: `hsl(${selectedHue},40%,92%)` }
                      : j === 6
                      ? { background: '#f5f0f8' }
                      : undefined
                    }
                  >
                    <span className="cof-roman">{roman}</span>
                    <span className="cof-chord-name">{key.diatonic[j]}</span>
                  </div>
                ))}
              </div>
              <p className="cof-chord-legend">
                Uppercase = major &nbsp;·&nbsp; lowercase = minor &nbsp;·&nbsp; ° = diminished
              </p>

              <p className="cof-section-label" style={{ marginTop: 24 }}>Neighboring keys</p>
              <div className="cof-neighbors">
                <button
                  type="button"
                  className="cof-neighbor-btn"
                  onClick={() => setSelected((selected! + 11) % 12)}
                >
                  ← {KEYS[(selected! + 11) % 12].major}
                  <span className="cof-neighbor-hint">one fifth down</span>
                </button>
                <button
                  type="button"
                  className="cof-neighbor-btn"
                  onClick={() => setSelected((selected! + 1) % 12)}
                >
                  {KEYS[(selected! + 1) % 12].major} →
                  <span className="cof-neighbor-hint">one fifth up</span>
                </button>
              </div>
            </>
          ) : (
            <div className="cof-empty-info">
              <h2>Explore any key</h2>
              <p>Click a wedge on the circle to see:</p>
              <ul>
                <li>Its key signature — which notes are sharped or flatted</li>
                <li>Its relative minor — the minor key sharing the same signature</li>
                <li>Its seven diatonic chords — the chords built from its scale</li>
                <li>Its neighbors — the keys a fifth above and below</li>
              </ul>
              <p className="cof-tip">
                <strong>Tip:</strong> The outer ring shows major keys; the inner ring shows
                their relative minors. Every pair shares exactly the same notes — just a
                different starting point.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
