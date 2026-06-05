/**
 * Intervals — theory topic page.
 *
 * Learn   — half-steps, interval names, quality (major/minor/perfect)
 * Practice — two modes: half-step count ↔ interval name
 */

import { useEffect, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'
import { theoryAudio, MIDI } from '../../lib/theoryAudio'

// ── Data ──────────────────────────────────────────────────────────────────────

interface Interval {
  semitones: number
  name: string
  abbrev: string
  quality: string
}

const INTERVALS: Interval[] = [
  { semitones:  1, name: 'Minor 2nd',   abbrev: 'm2',  quality: 'minor'   },
  { semitones:  2, name: 'Major 2nd',   abbrev: 'M2',  quality: 'major'   },
  { semitones:  3, name: 'Minor 3rd',   abbrev: 'm3',  quality: 'minor'   },
  { semitones:  4, name: 'Major 3rd',   abbrev: 'M3',  quality: 'major'   },
  { semitones:  5, name: 'Perfect 4th', abbrev: 'P4',  quality: 'perfect' },
  { semitones:  6, name: 'Tritone',     abbrev: 'TT',  quality: 'augmented/diminished' },
  { semitones:  7, name: 'Perfect 5th', abbrev: 'P5',  quality: 'perfect' },
  { semitones:  8, name: 'Minor 6th',   abbrev: 'm6',  quality: 'minor'   },
  { semitones:  9, name: 'Major 6th',   abbrev: 'M6',  quality: 'major'   },
  { semitones: 10, name: 'Minor 7th',   abbrev: 'm7',  quality: 'minor'   },
  { semitones: 11, name: 'Major 7th',   abbrev: 'M7',  quality: 'major'   },
  { semitones: 12, name: 'Octave',      abbrev: 'P8',  quality: 'perfect' },
]

// Exclude tritone from the practice pool — too ambiguous for beginners
const BEGINNER_POOL = INTERVALS.filter(i => i.semitones !== 6)

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function IntervalsLearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is an interval?</h2>
        <p>
          An <strong>interval</strong> is the distance in pitch between two notes. Intervals
          are the atoms of melody and harmony — every scale, chord, and melody is built from
          specific interval patterns. Learning to hear and identify them is one of the most
          valuable ear-training skills you can develop.
        </p>
        <p>
          The simplest unit of measurement is the <strong>half-step</strong> (also called a
          semitone). On a piano, a half-step is the distance from any key to the very next key
          — including black keys. Two half-steps make a <strong>whole step</strong>.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Interval names</h2>
        <p>
          Intervals are named by two things: their <strong>number</strong> (2nd, 3rd, 4th…)
          and their <strong>quality</strong> (major, minor, or perfect).
        </p>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '80px 1fr 60px 48px' }}>
            <span>Semitones</span><span>Name</span><span>Symbol</span><span></span>
          </div>
          {INTERVALS.map(iv => (
            <div key={iv.semitones} className="tt-sig-row" style={{ gridTemplateColumns: '80px 1fr 60px 48px' }}>
              <span className="tt-sig-key">{iv.semitones}</span>
              <span>{iv.name}</span>
              <span className="tt-sig-notes">{iv.abbrev}</span>
              <button
                type="button"
                className="iv-play-btn"
                aria-label={`Hear ${iv.name}`}
                title={`Hear ${iv.name}`}
                onClick={() => theoryAudio.playInterval(MIDI.C4, MIDI.C4 + iv.semitones)}
              >▶</button>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 6 }}>
          Each ▶ plays the lower note, then the upper note, then both together — from C.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Quality: major, minor, and perfect</h2>
        <p>
          Intervals that come in two flavours (larger and smaller) are called
          <strong> major</strong> (larger) and <strong>minor</strong> (smaller):
          2nds, 3rds, 6ths, and 7ths.
        </p>
        <p>
          Intervals that only come in one natural size are called <strong>perfect</strong>:
          unison, 4th, 5th, and octave. The word "perfect" reflects their special acoustic
          stability — they were the first intervals recognised in ancient theory.
        </p>
        <p>
          The <strong>tritone</strong> (6 semitones) sits exactly halfway through the octave
          and is neither major nor minor — it's historically called "the devil in music"
          because of its dissonant, unstable sound.
        </p>
        <p className="tt-learn-tip">
          💡 Shortcut for 4ths and 5ths: C up to F is a Perfect 4th (5 semitones).
          C up to G is a Perfect 5th (7 semitones). These two are the backbone of
          western harmony and appear in virtually every piece of music.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Recognising intervals by ear</h2>
        <p>
          Relating intervals to familiar melodies is the fastest way to internalise them:
        </p>
        <ul className="tt-learn-list">
          <li><strong>Minor 2nd</strong> — the half-step crunch in "Jaws"</li>
          <li><strong>Major 2nd</strong> — the opening of "Happy Birthday"</li>
          <li><strong>Minor 3rd</strong> — "Smoke on the Water" main riff</li>
          <li><strong>Major 3rd</strong> — "When the Saints Go Marching In"</li>
          <li><strong>Perfect 4th</strong> — "Here Comes the Bride"</li>
          <li><strong>Perfect 5th</strong> — the "Star Wars" theme opening</li>
          <li><strong>Major 6th</strong> — "My Bonnie Lies Over the Ocean"</li>
          <li><strong>Octave</strong> — "Somewhere Over the Rainbow" (first leap)</li>
        </ul>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

type IVMode = 'listen-to-name' | 'sing-along'

interface IVModeConfig {
  id: IVMode
  label: string
  pool: Interval[]
  hint: string
}

const IV_MODES: IVModeConfig[] = [
  {
    id: 'listen-to-name',
    label: 'Listen→Name',
    pool: BEGINNER_POOL,
    hint: 'Listen carefully — the interval plays root first, then the upper note, then both together.',
  },
  {
    id: 'sing-along',
    label: 'Sing Along',
    pool: BEGINNER_POOL,
    hint: 'Hear the root, imagine the target pitch, then reveal it to check.',
  },
]

function ivPickQuestion(pool: Interval[], excludeSemitones?: number): Interval {
  const candidates = excludeSemitones !== undefined && pool.length > 1
    ? pool.filter(i => i.semitones !== excludeSemitones)
    : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function ivPickChoices(correct: Interval, pool: Interval[]): string[] {
  const answer = correct.name
  const others = pool
    .filter(i => i.name !== answer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(i => i.name)
  return [...others, answer].sort(() => Math.random() - 0.5)
}

// ── Sing Along sub-component ──────────────────────────────────────────────────

interface IntervalSingAlongProps {
  question: Interval
  onAdvance: () => void
}

function IntervalSingAlong({ question, onAdvance }: IntervalSingAlongProps) {
  const [revealed, setRevealed] = useState(false)

  // Reset revealed state when question changes
  useEffect(() => { setRevealed(false) }, [question])

  function handleReveal() {
    setRevealed(true)
    theoryAudio.playNote(MIDI.C4 + question.semitones, 1.5)
  }

  return (
    <div className="theory-q-card">
      <div className="theory-q-main" style={{ fontSize: '1.4rem' }}>
        Sing a <strong>{question.name}</strong> above C
      </div>
      <div className="theory-q-sub">Root note: C4</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.8rem', alignItems: 'center' }}>
        <button
          type="button"
          className="iv-play-btn"
          style={{ fontSize: '0.95rem', padding: '6px 16px' }}
          onClick={() => theoryAudio.playNote(MIDI.C4, 1.2)}
        >
          ▶ Hear the root (C)
        </button>
        <button
          type="button"
          className="iv-play-btn"
          style={{ fontSize: '0.95rem', padding: '6px 16px' }}
          onClick={handleReveal}
        >
          ▶ Reveal target note
        </button>
      </div>
      {revealed && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="nq-choice nq-correct"
            style={{ flex: 1, maxWidth: 160 }}
            onClick={() => onAdvance()}
          >
            ✓ I heard it
          </button>
          <button
            type="button"
            className="nq-choice nq-wrong"
            style={{ flex: 1, maxWidth: 160 }}
            onClick={() => onAdvance()}
          >
            ✗ I missed it
          </button>
        </div>
      )}
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '1rem', lineHeight: 1.4 }}>
        We can't hear you — this trains your inner ear to imagine the target pitch before you reveal it.
      </p>
    </div>
  )
}

// ── Main quiz component ───────────────────────────────────────────────────────

export function IntervalsQuiz() {
  return (
    <TheoryQuiz<Interval>
      modes={IV_MODES}
      pickQuestion={(pool, excludeKey) =>
        ivPickQuestion(pool, excludeKey !== undefined ? Number(excludeKey) : undefined)
      }
      getExcludeKey={(q) => String(q.semitones)}
      pickChoices={(q, pool) => ivPickChoices(q, pool)}
      getAnswer={(q) => q.name}
      renderQuestion={(q, _modeId, selected, answer) => (
        <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
          <div className="theory-q-main">🎵</div>
          <div className="theory-q-sub">What interval did you hear?</div>
          <button
            type="button"
            className="iv-play-btn"
            style={{ marginTop: '0.5rem' }}
            onClick={() => theoryAudio.playInterval(MIDI.C4, MIDI.C4 + q.semitones)}
          >
            ▶ Play again
          </button>
        </div>
      )}
      onQuestionChange={(q, modeId) => {
        if (modeId !== 'listen-to-name') return
        const t = window.setTimeout(() => {
          theoryAudio.playInterval(MIDI.C4, MIDI.C4 + q.semitones)
        }, 300)
        return () => clearTimeout(t)
      }}
      renderCustomMode={(modeId, q, advance) =>
        modeId === 'sing-along'
          ? <IntervalSingAlong question={q} onAdvance={() => advance(String(q.semitones))} />
          : null
      }
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function IntervalsPage() {
  usePageTitle('Intervals')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Intervals</h1>
        <p className="tt-page-sub">
          The distance between two pitches — the building block of every melody and chord.
        </p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="↕️"
          title="Intervals"
          description="An interval is the distance in pitch between two notes, measured in half-steps (semitones). Intervals are the building blocks of every melody and chord — learning to hear them is one of the most valuable skills in music."
          keyFact="The Perfect 5th (7 semitones) is the most stable interval after the octave. The Minor 2nd (1 semitone) is the most dissonant. All harmony lives between these extremes."
          color="hsl(240, 65%, 52%)"
        />}
        learnContent={<IntervalsLearnContent />}
        gamesContent={<IntervalsQuiz />}
        topicName="intervals"
        gamesLabel="Practice"
      />
    </div>
  )
}
