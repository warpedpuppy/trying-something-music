/**
 * Intervals — theory topic page.
 *
 * Learn   — half-steps, interval names, quality (major/minor/perfect)
 * Practice — two modes: half-step count ↔ interval name
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
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

// Beginner pool — exclude tritone until "all intervals" mode
const BEGINNER_POOL  = INTERVALS.filter(i => i.semitones !== 6)
const FULL_POOL      = INTERVALS

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

type IVMode = 'count-to-name' | 'name-to-count'

interface IVModeConfig {
  id: IVMode
  label: string
  pool: Interval[]
  hint: string
}

const IV_MODES: IVModeConfig[] = [
  {
    id: 'count-to-name',
    label: 'Count → Name',
    pool: BEGINNER_POOL,
    hint: 'Minor/Major = 2nds, 3rds, 6ths, 7ths  ·  Perfect = 4ths, 5ths, Octave',
  },
  {
    id: 'name-to-count',
    label: 'Name → Count',
    pool: FULL_POOL,
    hint: 'Count half-steps: W = 2, 3rd = 3–4, 4th = 5, 5th = 7, Octave = 12',
  },
]

function ivPickQuestion(pool: Interval[], excludeSemitones?: number): Interval {
  const candidates = excludeSemitones !== undefined && pool.length > 1
    ? pool.filter(i => i.semitones !== excludeSemitones)
    : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function ivPickChoices(mode: IVMode, correct: Interval, pool: Interval[]): string[] {
  if (mode === 'count-to-name') {
    const answer = correct.name
    const others = pool
      .filter(i => i.name !== answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(i => i.name)
    return [...others, answer].sort(() => Math.random() - 0.5)
  } else {
    const answer = String(correct.semitones)
    const others = pool
      .filter(i => i.semitones !== correct.semitones)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(i => String(i.semitones))
    return [...others, answer].sort(() => Math.random() - 0.5)
  }
}

function IntervalsQuiz() {
  const [modeId, setModeId]     = useState<IVMode>('count-to-name')
  const modeConfig              = IV_MODES.find(m => m.id === modeId)!
  const [question, setQuestion] = useState<Interval>(() => ivPickQuestion(modeConfig.pool))
  const [choices, setChoices]   = useState<string[]>(() => ivPickChoices(modeId, question, modeConfig.pool))
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore]       = useState(0)
  const [total, setTotal]       = useState(0)
  const [streak, setStreak]     = useState(0)
  const [best, setBest]         = useState(0)
  const timerRef   = useRef<number | null>(null)
  const modeIdRef  = useRef<IVMode>('count-to-name')
  modeIdRef.current = modeId

  const switchMode = useCallback((m: IVMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const cfg = IV_MODES.find(x => x.id === m)!
    modeIdRef.current = m
    const q = ivPickQuestion(cfg.pool)
    setModeId(m)
    setQuestion(q)
    setChoices(ivPickChoices(m, q, cfg.pool))
    setSelected(null)
    setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance(fromSemitones: number) {
    const m = modeIdRef.current
    const cfg = IV_MODES.find(x => x.id === m)!
    const q = ivPickQuestion(cfg.pool, fromSemitones)
    setQuestion(q)
    setChoices(ivPickChoices(m, q, cfg.pool))
    setSelected(null)
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const answer = modeId === 'count-to-name' ? question.name : String(question.semitones)
    const correct = choice === answer
    setSelected(choice)
    setTotal(t => t + 1)
    if (correct) {
      setScore(s => s + 1)
      setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n })
    } else {
      setStreak(0)
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => advance(question.semitones), correct ? 650 : 1200)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const answer   = modeId === 'count-to-name' ? question.name : String(question.semitones)
  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  return (
    <div className="nq-root">

      <div className="nq-mode-row">
        {IV_MODES.map(m => (
          <button key={m.id} type="button"
            className={`nq-mode-btn${modeId === m.id ? ' active' : ''}`}
            onClick={() => switchMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="nq-score-row">
        <div className="nq-stat">
          <span className="nq-stat-value">{score}<span className="nq-stat-denom">/{total}</span></span>
          <span className="nq-stat-label">correct</span>
        </div>
        {accuracy !== null && (
          <div className="nq-stat">
            <span className="nq-stat-value">{accuracy}%</span>
            <span className="nq-stat-label">accuracy</span>
          </div>
        )}
        <div className="nq-stat">
          <span className="nq-stat-value">{streak >= 3 ? `🔥 ${streak}` : streak}</span>
          <span className="nq-stat-label">streak {best > 0 ? `(best ${best})` : ''}</span>
        </div>
      </div>

      <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
        {modeId === 'count-to-name' ? (
          <>
            <div className="theory-q-main">
              {question.semitones}
              <span style={{ fontSize: '1.1rem', fontWeight: 600, marginLeft: 6 }}>
                {question.semitones === 1 ? 'semitone' : 'semitones'}
              </span>
            </div>
            <div className="theory-q-sub">What is this interval called?</div>
          </>
        ) : (
          <>
            <div className="theory-q-main">{question.name}</div>
            <div className="theory-q-sub">How many semitones?</div>
          </>
        )}
      </div>

      <div className="nq-choices">
        {choices.map(choice => {
          const isCorrect  = choice === answer
          const isSelected = choice === selected
          let cls = 'nq-choice'
          if (selected !== null) {
            if (isSelected && isCorrect)  cls += ' nq-correct'
            else if (isSelected)          cls += ' nq-wrong'
            else if (isCorrect)           cls += ' nq-reveal'
          }
          return (
            <button key={choice} type="button" className={cls}
              onClick={() => handleAnswer(choice)} disabled={selected !== null}>
              {modeId === 'name-to-count' ? `${choice} semitone${choice === '1' ? '' : 's'}` : choice}
            </button>
          )
        })}
      </div>

      <p className="nq-hint">{modeConfig.hint}</p>

    </div>
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
        learnContent={<IntervalsLearnContent />}
        gamesContent={<IntervalsQuiz />}
        topicName="intervals"
        gamesLabel="Practice"
      />
    </div>
  )
}
