/**
 * Scales & the Major Scale — theory topic page.
 *
 * Learn   — what a scale is, the W-W-H pattern, all 12 major scales
 * Practice — two modes: given root+degree → name the note; given root+note → name the degree
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

const SCALE_KEYS   = Object.keys(MAJOR_SCALES)
const DEGREE_NAMES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th']

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function ScalesLearnContent() {
  const pattern = [
    { step: 'W',  label: 'Whole', from: 'C', to: 'D' },
    { step: 'W',  label: 'Whole', from: 'D', to: 'E' },
    { step: 'H',  label: 'Half',  from: 'E', to: 'F' },
    { step: 'W',  label: 'Whole', from: 'F', to: 'G' },
    { step: 'W',  label: 'Whole', from: 'G', to: 'A' },
    { step: 'W',  label: 'Whole', from: 'A', to: 'B' },
    { step: 'H',  label: 'Half',  from: 'B', to: 'C' },
  ]

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
          In Western music, the <strong>major scale</strong> is the single most important
          scale. Virtually everything in classical, pop, folk, and jazz is built from — or
          measured against — its structure.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The W–W–H–W–W–W–H pattern</h2>
        <p>
          Every major scale follows the same interval pattern between consecutive notes:
          <strong> Whole – Whole – Half – Whole – Whole – Whole – Half</strong>. This
          pattern is what makes all major scales sound the same, just starting on different
          pitches.
        </p>
        <div className="scales-pattern">
          {pattern.map((s, i) => (
            <div key={i} className="scales-step">
              <div className="scales-step-note">{s.from}</div>
              <div className={`scales-step-arrow${s.step === 'H' ? ' scales-half' : ''}`}>
                {s.step}
              </div>
              {i === pattern.length - 1 && (
                <div className="scales-step-note">{s.to}</div>
              )}
            </div>
          ))}
        </div>
        <p>
          The two half-steps fall between degrees 3–4 and 7–8. That gap between 7 and 8
          (called the <em>leading tone</em>) is what gives the major scale its satisfying
          pull back to the tonic.
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
          <li><strong>3 — Mediant.</strong> Defines major vs minor quality.</li>
          <li><strong>4 — Subdominant.</strong> Creates tension away from tonic.</li>
          <li><strong>5 — Dominant.</strong> The second most important note after the tonic.</li>
          <li><strong>6 — Submediant.</strong> The root of the relative minor.</li>
          <li><strong>7 — Leading tone.</strong> One half-step below tonic; strongly pulls upward.</li>
        </ul>
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
        <p className="tt-learn-tip">
          💡 To build any major scale: start on the root, follow W–W–H–W–W–W–H, adding
          sharps or flats as needed to maintain the pattern. You don't need to memorise
          all 12 — knowing the pattern lets you derive them on the fly.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

interface ScaleQuestion {
  key: string
  degree: number
  note: string
}

const SCALE_QUESTION_POOL: ScaleQuestion[] = SCALE_KEYS.flatMap(key =>
  [1, 2, 3, 4, 5, 6, 7].map(deg => ({
    key,
    degree: deg,
    note: MAJOR_SCALES[key][deg - 1],
  }))
)

function scalePick(pool: ScaleQuestion[], excludeKey?: string): ScaleQuestion {
  const filtered = excludeKey ? pool.filter(q => q.key !== excludeKey) : pool
  const p = filtered.length > 0 ? filtered : pool
  return p[Math.floor(Math.random() * p.length)]
}

function scalePickChoices(q: ScaleQuestion, _pool: ScaleQuestion[], modeId: string): string[] {
  if (modeId === 'degree-to-note') {
    const scaleNotes = MAJOR_SCALES[q.key]
    const others = scaleNotes.filter(n => n !== q.note).sort(() => Math.random() - 0.5).slice(0, 3)
    return [...others, q.note].sort(() => Math.random() - 0.5)
  }
  // note-to-degree: return degree name strings so choices display correctly
  const answer = DEGREE_NAMES[q.degree - 1]
  const others = DEGREE_NAMES.filter(d => d !== answer).sort(() => Math.random() - 0.5).slice(0, 3)
  return [...others, answer].sort(() => Math.random() - 0.5)
}

const SCALE_MODES: QuizMode<ScaleQuestion>[] = [
  { id: 'degree-to-note', label: 'Degree → Note', pool: SCALE_QUESTION_POOL, hint: 'Pattern: W – W – H – W – W – W – H' },
  { id: 'note-to-degree', label: 'Note → Degree', pool: SCALE_QUESTION_POOL, hint: 'Pattern: W – W – H – W – W – W – H' },
]

export function ScalesQuiz() {
  return (
    <TheoryQuiz<ScaleQuestion>
      modes={SCALE_MODES}
      pickQuestion={scalePick}
      getExcludeKey={q => q.key}
      pickChoices={scalePickChoices}
      getAnswer={(q, modeId) => modeId === 'degree-to-note' ? q.note : DEGREE_NAMES[q.degree - 1]}
      renderQuestion={(q, modeId, selected, answer) => {
        const scaleDisplay = MAJOR_SCALES[q.key].map((n, i) => ({
          note: n, degree: i + 1, isTarget: i + 1 === q.degree,
        }))
        return (
          <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
            {modeId === 'degree-to-note' ? (
              <>
                <div className="theory-q-main">{DEGREE_NAMES[q.degree - 1]} degree</div>
                <div className="theory-q-sub">of <strong>{q.key} major</strong></div>
              </>
            ) : (
              <>
                <div className="theory-q-main">{q.note}</div>
                <div className="theory-q-sub">is the ___ degree of <strong>{q.key} major</strong></div>
              </>
            )}
            <div className="scales-mini-strip">
              {scaleDisplay.map(({ note, degree, isTarget }) => (
                <div key={degree}
                  className={`scales-mini-note${isTarget ? ' scales-mini-target' : ''}`}
                  title={`Degree ${degree}`}>
                  <span className="scales-mini-notename">{note}</span>
                  <span className="scales-mini-deg">{degree}</span>
                </div>
              ))}
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
  usePageTitle('Scales & the Major Scale')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Scales &amp; the Major Scale</h1>
        <p className="tt-page-sub">
          The W–W–H–W–W–W–H pattern that underlies all of Western harmony.
        </p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🎼"
          title="Scales"
          description="A scale is an ordered set of notes spanning an octave. The major scale (do-re-mi) and natural minor scale are the foundation of virtually all western melody and harmony."
          keyFact="Every major scale has a relative minor that shares the same notes — just starting from a different place. C major and A minor use identical notes."
          color="hsl(270, 65%, 52%)"
        />}
        learnContent={<ScalesLearnContent />}
        gamesContent={<ScalesQuiz />}
        topicName="scales &amp; the major scale"
        gamesLabel="Practice"
      />
    </div>
  )
}
