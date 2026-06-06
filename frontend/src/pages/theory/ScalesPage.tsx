/**
 * Scales: Major & Minor — theory topic page.
 *
 * Learn   — what a scale is, major W-W-H pattern, minor W-H-W pattern,
 *           relative major/minor relationship, all 12 of each
 * Practice — four modes: major/minor × degree-to-note/note-to-degree
 */

import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz, type QuizMode } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

const MAJOR_SCALES: Record<string, string[]> = {
  'C':  ['C',  'D',  'E',  'F',  'G',  'A',  'B' ],
  'G':  ['G',  'A',  'B',  'C',  'D',  'E',  'F♯'],
  'D':  ['D',  'E',  'F♯', 'G',  'A',  'B',  'C♯'],
  'A':  ['A',  'B',  'C♯', 'D',  'E',  'F♯', 'G♯'],
  'E':  ['E',  'F♯', 'G♯', 'A',  'B',  'C♯', 'D♯'],
  'B':  ['B',  'C♯', 'D♯', 'E',  'F♯', 'G♯', 'A♯'],
  'F':  ['F',  'G',  'A',  'B♭', 'C',  'D',  'E' ],
  'B♭': ['B♭', 'C',  'D',  'E♭', 'F',  'G',  'A' ],
  'E♭': ['E♭', 'F',  'G',  'A♭', 'B♭', 'C',  'D' ],
  'A♭': ['A♭', 'B♭', 'C',  'D♭', 'E♭', 'F',  'G' ],
  'D♭': ['D♭', 'E♭', 'F',  'G♭', 'A♭', 'B♭', 'C' ],
  'G♭': ['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F' ],
}

const NATURAL_MINOR_SCALES: Record<string, string[]> = {
  'A':  ['A',  'B',  'C',  'D',  'E',  'F',  'G' ],
  'E':  ['E',  'F♯', 'G',  'A',  'B',  'C',  'D' ],
  'B':  ['B',  'C♯', 'D',  'E',  'F♯', 'G',  'A' ],
  'F♯': ['F♯', 'G♯', 'A',  'B',  'C♯', 'D',  'E' ],
  'C♯': ['C♯', 'D♯', 'E',  'F♯', 'G♯', 'A',  'B' ],
  'G♯': ['G♯', 'A♯', 'B',  'C♯', 'D♯', 'E',  'F♯'],
  'D':  ['D',  'E',  'F',  'G',  'A',  'B♭', 'C' ],
  'G':  ['G',  'A',  'B♭', 'C',  'D',  'E♭', 'F' ],
  'C':  ['C',  'D',  'E♭', 'F',  'G',  'A♭', 'B♭'],
  'F':  ['F',  'G',  'A♭', 'B♭', 'C',  'D♭', 'E♭'],
  'B♭': ['B♭', 'C',  'D♭', 'E♭', 'F',  'G♭', 'A♭'],
  'E♭': ['E♭', 'F',  'G♭', 'A♭', 'B♭', 'C♭', 'D♭'],
}

const RELATIVE_PAIRS: Array<{ major: string; minor: string }> = [
  { major: 'C',  minor: 'A'  }, { major: 'G',  minor: 'E'  },
  { major: 'D',  minor: 'B'  }, { major: 'A',  minor: 'F♯' },
  { major: 'E',  minor: 'C♯' }, { major: 'B',  minor: 'G♯' },
  { major: 'F',  minor: 'D'  }, { major: 'B♭', minor: 'G'  },
  { major: 'E♭', minor: 'C'  }, { major: 'A♭', minor: 'F'  },
  { major: 'D♭', minor: 'B♭' }, { major: 'G♭', minor: 'E♭' },
]

const SCALE_KEYS  = Object.keys(MAJOR_SCALES)
const MINOR_KEYS  = Object.keys(NATURAL_MINOR_SCALES)

// ── Piano keyboard diagram ─────────────────────────────────────────────────────
// White key width=38, so black key x = (gapIndex+1)*38 - 12

const C_MAJOR_BLACK = [
  { x: 26, name: 'C♯' }, { x: 64, name: 'D♯' },
  { x: 140, name: 'F♯' }, { x: 178, name: 'G♯' }, { x: 216, name: 'A♯' },
]
const A_MINOR_BLACK = [
  { x: 26, name: 'A♯' },
  { x: 102, name: 'C♯' }, { x: 140, name: 'D♯' },
  { x: 216, name: 'F♯' }, { x: 254, name: 'G♯' },
]

function PianoScaleDiagram({
  whiteNotes,
  blackKeys,
  steps,
}: {
  whiteNotes: string[]
  blackKeys: Array<{ x: number; name: string }>
  steps: Array<'W' | 'H'>
}) {
  const WW = 38, WH = 100, BW = 24, BH = 62
  const svgW = whiteNotes.length * WW
  const svgH = WH + 44
  const cx = (i: number) => i * WW + WW / 2

  return (
    <div className="piano-diagram-wrap">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ display: 'block', width: '100%', maxWidth: svgW, margin: '0 auto', overflow: 'visible' }}
        aria-hidden="true"
      >
        {/* White keys */}
        {whiteNotes.map((note, i) => {
          const isRoot = i === 0 || i === whiteNotes.length - 1
          return (
            <g key={i}>
              <rect
                x={i * WW + 1} y={0} width={WW - 2} height={WH}
                fill={isRoot ? '#7c3aed' : '#ede9fe'}
                stroke="#9ca3af" strokeWidth={1} rx={2}
              />
              <text
                x={cx(i)} y={WH - 10}
                textAnchor="middle" fontSize={11} fontWeight={700}
                fill={isRoot ? '#fff' : '#5b21b6'}
              >
                {note}
              </text>
            </g>
          )
        })}

        {/* Black keys */}
        {blackKeys.map((bk, i) => (
          <g key={i}>
            <rect x={bk.x} y={0} width={BW} height={BH} fill="#2d2d2d" stroke="#111" strokeWidth={1} rx={2} />
            <text x={bk.x + BW / 2} y={BH - 6} textAnchor="middle" fontSize={7} fill="#999">{bk.name}</text>
          </g>
        ))}

        {/* Step labels */}
        {steps.map((step, i) => {
          const x = (cx(i) + cx(i + 1)) / 2
          const isH = step === 'H'
          const col = isH ? '#dc2626' : '#9ca3af'
          return (
            <g key={i}>
              <text x={x} y={WH + 18} textAnchor="middle" fontSize={13} fontWeight={800} fill={col}>{step}</text>
              <text x={x} y={WH + 33} textAnchor="middle" fontSize={8} fill={col}>{isH ? 'half' : 'whole'}</text>
            </g>
          )
        })}
      </svg>
      <p className="piano-diagram-legend">
        <span style={{ color: '#dc2626', fontWeight: 700 }}>Red = half step</span> (no black key between the two white keys) &nbsp;·&nbsp;
        <span style={{ color: '#9ca3af' }}>Gray = whole step</span> (black key in between)
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function ScalesLearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a scale?</h2>
        <p>
          A <strong>scale</strong> is an ordered set of notes arranged by pitch, spanning
          one octave. Scales give music its character — the major scale sounds bright and
          settled; minor scales sound darker or more tense; exotic scales create
          unexpected moods.
        </p>
        <p>
          In Western music, the <strong>major scale</strong> and the{' '}
          <strong>natural minor scale</strong> are the two foundations. Virtually everything
          in classical, pop, folk, and jazz is built from one of them — or measured against
          their structure.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The major scale</h2>
        <p>
          Every major scale follows the same pattern of steps between consecutive notes:
          <strong> Whole – Whole – Half – Whole – Whole – Whole – Half</strong>. This
          pattern is what makes all major scales sound the same, just starting on different
          pitches.
        </p>
        <p>
          The piano communicates this structure visually. Look at C major below — most pairs
          of adjacent white keys have a black key between them, making a <strong>whole step</strong> (two
          semitones). But between E and F, and between B and C, there is no black key: those
          are the <strong>half steps</strong> (one semitone each).
        </p>
        <PianoScaleDiagram
          whiteNotes={['C','D','E','F','G','A','B','C']}
          blackKeys={C_MAJOR_BLACK}
          steps={['W','W','H','W','W','W','H']}
        />
        <p>
          The half step between B and C (degrees 7–8) is especially important. Because B is
          only a single semitone below C, it has a strong pull upward — this is called the{' '}
          <em>leading tone</em>, and it is a big part of why the major scale feels resolved
          and bright.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The natural minor scale</h2>
        <p>
          The <strong>natural minor scale</strong> uses a different pattern —{' '}
          <strong>Whole – Half – Whole – Whole – Half – Whole – Whole</strong> — which
          shifts the half steps to different positions and changes the emotional character
          entirely: darker, more open-ended, less settled.
        </p>
        <p>
          Here is A natural minor on the piano. Notice something interesting: it uses exactly
          the same white keys as C major — no black keys at all. The only difference is the
          starting note. That shift of starting point moves the half steps to new positions
          in the sequence, and that is all it takes to change the mood completely.
        </p>
        <PianoScaleDiagram
          whiteNotes={['A','B','C','D','E','F','G','A']}
          blackKeys={A_MINOR_BLACK}
          steps={['W','H','W','W','H','W','W']}
        />
        <p>
          The half steps now fall between B and C (degrees 2–3) and between E and F
          (degrees 5–6). Degree 7 (G) is a whole step below the tonic — not a half step —
          so it no longer has the same upward pull, which is a big reason minor feels less
          conclusive and more melancholic.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Scale degrees</h2>
        <p>
          Each note in a scale has a numbered position called a <strong>scale degree</strong>.
          Degree 1 is the tonic (the home note). Degrees have names too:
        </p>
        <ul className="tt-learn-list">
          <li><strong>1 — Tonic.</strong> Home base. Music gravitates back to it.</li>
          <li><strong>2 — Supertonic.</strong> One step above.</li>
          <li><strong>3 — Mediant.</strong> Defines major vs. minor quality.</li>
          <li><strong>4 — Subdominant.</strong> Creates tension away from tonic.</li>
          <li><strong>5 — Dominant.</strong> The second most important note after the tonic.</li>
          <li><strong>6 — Submediant.</strong> The root of the relative minor.</li>
          <li><strong>7 — Leading tone / subtonic.</strong> Half-step below tonic in major (leading tone); whole step below in natural minor (subtonic).</li>
        </ul>
      </section>

      <section className="tt-learn-section">
        <h2>Relative major and minor</h2>
        <p>
          Every major scale has a <strong>relative minor</strong> that uses exactly the same
          notes — just starting from degree 6. C major (C D E F G A B) and A minor
          (A B C D E F G) share all seven notes; only the starting point differs. That shift
          of perspective is what changes the mood entirely.
        </p>
        <p>
          Conversely, every minor key has a <strong>relative major</strong> starting a
          minor third above it. Knowing these pairs lets you move between related keys
          effortlessly.
        </p>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header">
            <span>Major key</span><span>Relative minor</span>
          </div>
          {RELATIVE_PAIRS.map(({ major, minor }) => (
            <div key={major} className="tt-sig-row">
              <span className="tt-sig-key">{major} major</span>
              <span className="tt-sig-key">{minor} minor</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>All 12 major scales</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header">
            <span style={{ minWidth: 40 }}>Key</span>
            <span>1  2  3  4  5  6  7</span>
          </div>
          {SCALE_KEYS.map(key => (
            <div key={key} className="tt-sig-row">
              <span className="tt-sig-key" style={{ minWidth: 40 }}>{key}</span>
              <span className="tt-sig-notes" style={{ letterSpacing: '0.05em' }}>
                {MAJOR_SCALES[key].join('  ')}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>All 12 natural minor scales</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header">
            <span style={{ minWidth: 40 }}>Key</span>
            <span>1  2  3  4  5  6  7</span>
          </div>
          {MINOR_KEYS.map(key => (
            <div key={key} className="tt-sig-row">
              <span className="tt-sig-key" style={{ minWidth: 40 }}>{key} min</span>
              <span className="tt-sig-notes" style={{ letterSpacing: '0.05em' }}>
                {NATURAL_MINOR_SCALES[key].join('  ')}
              </span>
            </div>
          ))}
        </div>
        <p className="tt-learn-tip">
          💡 To build any scale from scratch: start on the root and follow the step pattern —
          W–W–H–W–W–W–H for major, W–H–W–W–H–W–W for natural minor. You don't need to
          memorise all 24 — the patterns let you derive any of them on the fly.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const MAJOR_STEPS: ('W' | 'H')[] = ['W','W','H','W','W','W','H']
const MINOR_STEPS: ('W' | 'H')[] = ['W','H','W','W','H','W','W']
const ORDINALS = ['1st','2nd','3rd','4th','5th','6th','7th','8th']

interface StepQuestion {
  key: string
  degree: number       // 1–7: the FROM degree of the interval
  step: 'W' | 'H'
  scaleType: 'major' | 'minor'
}

const MAJOR_STEP_POOL: StepQuestion[] = SCALE_KEYS.flatMap(key =>
  MAJOR_STEPS.map((step, i) => ({ key, degree: i + 1, step, scaleType: 'major' as const }))
)

const MINOR_STEP_POOL: StepQuestion[] = MINOR_KEYS.flatMap(key =>
  MINOR_STEPS.map((step, i) => ({ key, degree: i + 1, step, scaleType: 'minor' as const }))
)

const BOTH_STEP_POOL: StepQuestion[] = [...MAJOR_STEP_POOL, ...MINOR_STEP_POOL]

function stepPick(pool: StepQuestion[], excludeKey?: string): StepQuestion {
  const filtered = excludeKey ? pool.filter(q => `${q.key}-${q.scaleType}` !== excludeKey) : pool
  const p = filtered.length > 0 ? filtered : pool
  return p[Math.floor(Math.random() * p.length)]
}

const SCALE_MODES: QuizMode<StepQuestion>[] = [
  { id: 'major', label: 'Major', pool: MAJOR_STEP_POOL, hint: 'Pattern: Whole – Whole – Half – Whole – Whole – Whole – Half' },
  { id: 'minor', label: 'Minor', pool: MINOR_STEP_POOL, hint: 'Pattern: Whole – Half – Whole – Whole – Half – Whole – Whole' },
  { id: 'both',  label: 'Both',  pool: BOTH_STEP_POOL,  hint: 'Major: W–W–H–W–W–W–H  ·  Minor: W–H–W–W–H–W–W' },
]

export function ScalesQuiz() {
  return (
    <TheoryQuiz<StepQuestion>
      modes={SCALE_MODES}
      pickQuestion={stepPick}
      getExcludeKey={q => `${q.key}-${q.scaleType}`}
      pickChoices={() => Math.random() > 0.5 ? ['Whole step', 'Half step'] : ['Half step', 'Whole step']}
      getAnswer={q => q.step === 'W' ? 'Whole step' : 'Half step'}
      renderQuestion={(q, _modeId, selected, answer) => {
        const scaleNotes = (q.scaleType === 'major' ? MAJOR_SCALES : NATURAL_MINOR_SCALES)[q.key]
        const noteFrom = scaleNotes[q.degree - 1]
        const noteTo   = q.degree === 7 ? scaleNotes[0] : scaleNotes[q.degree]
        const isCorrect = selected !== null && selected === answer
        const isWrong   = selected !== null && selected !== answer
        return (
          <div className={`theory-q-card${isCorrect ? ' theory-q-correct' : isWrong ? ' theory-q-wrong' : ''}`}>
            <div className="theory-q-main">{noteFrom} → {noteTo}</div>
            <div className="theory-q-sub">
              {ORDINALS[q.degree - 1]} to {ORDINALS[q.degree]} note of{' '}
              <strong>{q.key} {q.scaleType}</strong>
            </div>
            <div className="theory-q-prompt">Is this a whole step or a half step?</div>
            <div className="scales-mini-strip">
              {scaleNotes.map((note, i) => {
                const deg = i + 1
                const isTarget = deg === q.degree || deg === q.degree + 1
                return (
                  <div key={deg}
                    className={`scales-mini-note${isTarget ? ' scales-mini-target' : ''}`}
                    title={`Degree ${deg}`}>
                    <span className="scales-mini-notename">{note}</span>
                    <span className="scales-mini-deg">{deg}</span>
                  </div>
                )
              })}
              {q.degree === 7 && (
                <div className="scales-mini-note scales-mini-target" title="Degree 8">
                  <span className="scales-mini-notename">{scaleNotes[0]}</span>
                  <span className="scales-mini-deg">8</span>
                </div>
              )}
            </div>
          </div>
        )
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function ScalesAndMajorScale() {
  usePageTitle('Scales: Major & Minor')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Scales: Major &amp; Minor</h1>
        <p className="tt-page-sub">
          The two patterns — W–W–H–W–W–W–H and W–H–W–W–H–W–W — that define the sound
          of every key in Western music.
        </p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🎼"
          title="Scales: Major & Minor"
          description="A scale is an ordered set of notes spanning an octave. The major scale sounds bright and resolved; the natural minor sounds darker and more open-ended. Together they underlie virtually all of Western melody and harmony."
          keyFact="Every major scale has a relative minor that shares the same notes — just starting from degree 6. C major and A minor use identical notes."
          color="hsl(270, 65%, 52%)"
        />}
        learnContent={<ScalesLearnContent />}
        gamesContent={<ScalesQuiz />}
        topicName="scales"
        gamesLabel="Practice"
      />
    </div>
  )
}
