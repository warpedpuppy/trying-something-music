/**
 * Key Signatures — theory topic page.
 *
 * Learn    — what a key signature is, sharp/flat orders, identification shortcuts
 * Practice — visual quiz: identify key from a rendered key signature
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Renderer, Stave } from 'vexflow'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { usePageTitle } from '../../hooks/usePageTitle'
import { KeySignaturesOverview } from './KeySignaturesOverview'

// ── Learn data ────────────────────────────────────────────────────────────────

const SHARP_ORDER = ['F♯','C♯','G♯','D♯','A♯','E♯','B♯']
const FLAT_ORDER  = ['B♭','E♭','A♭','D♭','G♭','C♭','F♭']

interface KeySig {
  key: string
  sf: number
  sfLabel: string
  accidentals: string[]
}

const KEY_SIGS: KeySig[] = [
  { key: 'C',  sf:  0, sfLabel: '—',  accidentals: [] },
  { key: 'G',  sf:  1, sfLabel: '1♯', accidentals: SHARP_ORDER.slice(0, 1) },
  { key: 'D',  sf:  2, sfLabel: '2♯', accidentals: SHARP_ORDER.slice(0, 2) },
  { key: 'A',  sf:  3, sfLabel: '3♯', accidentals: SHARP_ORDER.slice(0, 3) },
  { key: 'E',  sf:  4, sfLabel: '4♯', accidentals: SHARP_ORDER.slice(0, 4) },
  { key: 'B',  sf:  5, sfLabel: '5♯', accidentals: SHARP_ORDER.slice(0, 5) },
  { key: 'F♯', sf:  6, sfLabel: '6♯', accidentals: SHARP_ORDER.slice(0, 6) },
  { key: 'F',  sf: -1, sfLabel: '1♭', accidentals: FLAT_ORDER.slice(0, 1) },
  { key: 'B♭', sf: -2, sfLabel: '2♭', accidentals: FLAT_ORDER.slice(0, 2) },
  { key: 'E♭', sf: -3, sfLabel: '3♭', accidentals: FLAT_ORDER.slice(0, 3) },
  { key: 'A♭', sf: -4, sfLabel: '4♭', accidentals: FLAT_ORDER.slice(0, 4) },
  { key: 'D♭', sf: -5, sfLabel: '5♭', accidentals: FLAT_ORDER.slice(0, 5) },
  { key: 'G♭', sf: -6, sfLabel: '6♭', accidentals: FLAT_ORDER.slice(0, 6) },
]

// ── Quiz data ─────────────────────────────────────────────────────────────────

interface KeyQuizEntry {
  vfKey: string    // VexFlow addKeySignature() string
  sf: number
  major: string    // major key display name, e.g. 'G', 'B♭'
  minor: string    // relative minor display name, e.g. 'E', 'G'
}

const KEY_QUIZ: KeyQuizEntry[] = [
  { vfKey: 'C',  sf:  0, major: 'C',  minor: 'A'  },
  { vfKey: 'G',  sf:  1, major: 'G',  minor: 'E'  },
  { vfKey: 'D',  sf:  2, major: 'D',  minor: 'B'  },
  { vfKey: 'A',  sf:  3, major: 'A',  minor: 'F♯' },
  { vfKey: 'E',  sf:  4, major: 'E',  minor: 'C♯' },
  { vfKey: 'B',  sf:  5, major: 'B',  minor: 'G♯' },
  { vfKey: 'F#', sf:  6, major: 'F♯', minor: 'D♯' },
  { vfKey: 'F',  sf: -1, major: 'F',  minor: 'D'  },
  { vfKey: 'Bb', sf: -2, major: 'B♭', minor: 'G'  },
  { vfKey: 'Eb', sf: -3, major: 'E♭', minor: 'C'  },
  { vfKey: 'Ab', sf: -4, major: 'A♭', minor: 'F'  },
  { vfKey: 'Db', sf: -5, major: 'D♭', minor: 'B♭' },
  { vfKey: 'Gb', sf: -6, major: 'G♭', minor: 'E♭' },
]

// ── Quiz helpers ──────────────────────────────────────────────────────────────

type KSAsk  = 'major' | 'minor'
type KSMode = 'major' | 'minor' | 'both'

interface KSQuestion {
  entry:   KeyQuizEntry
  asking:  KSAsk
  answer:  string
  choices: string[]
}

function ksPickQ(mode: KSMode, excludeVfKey?: string): KSQuestion {
  const pool = excludeVfKey
    ? KEY_QUIZ.filter(k => k.vfKey !== excludeVfKey)
    : KEY_QUIZ
  const entry  = pool[Math.floor(Math.random() * pool.length)]
  const asking: KSAsk =
    mode === 'both' ? (Math.random() > 0.5 ? 'major' : 'minor') : mode
  const answer = asking === 'major' ? entry.major : entry.minor
  const allNames = KEY_QUIZ.map(k => asking === 'major' ? k.major : k.minor)
  const wrong = [...new Set(allNames.filter(n => n !== answer))]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  const choices = [...wrong, answer].sort(() => Math.random() - 0.5)
  return { entry, asking, answer, choices }
}

// ── VexFlow key sig renderer (quiz only — compact, no note) ───────────────────

function renderQuizKeySig(container: HTMLDivElement, vfKey: string): void {
  container.innerHTML = ''
  // STAVE_Y=38 leaves 38 px above the top staff line for the treble-clef curl.
  // H=115 leaves 37 px below the bottom staff line (y=78) for the clef tail.
  const W = 200, H = 115, STAVE_Y = 38
  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(W, H)
  const ctx = renderer.getContext()
  const svgEl = container.querySelector('svg')
  if (svgEl) {
    svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`)
    svgEl.style.width    = '100%'
    svgEl.style.height   = 'auto'
    svgEl.style.display  = 'block'
    svgEl.style.overflow = 'visible'
  }
  const stave = new Stave(8, STAVE_Y, W - 16)
  stave.addClef('treble').addKeySignature(vfKey)
  stave.setContext(ctx).draw()
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function KeySigsLearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a key signature?</h2>
        <p>
          A <strong>key signature</strong> appears at the start of every staff line, right
          after the clef. It lists the notes that are permanently sharp or flat throughout the
          piece, so the composer doesn't need to write accidentals (the ♯, ♭, and ♮ signs
          that raise, lower, or restore individual notes) on every single note.
        </p>
        <p>
          Two sharps (F♯ and C♯) at the start of every line means every F and C in the
          music is sharp — unless a natural sign cancels it. Two sharps signals the key
          of D major.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Sharp keys <span className="tt-clef-glyph">♯</span></h2>
        <p>
          Moving <strong>clockwise</strong> around the circle of fifths adds one sharp per
          step. Sharps are always added in the same fixed order:
          <strong> F  C  G  D  A  E  B</strong>.
          Mnemonic: <em>"Father Charles Goes Down And Ends Battle."</em>
        </p>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header">
            <span>Key</span><span>Sharps</span><span>Notes added</span>
          </div>
          {KEY_SIGS.filter(k => k.sf >= 0).map(k => (
            <div key={k.key} className="tt-sig-row">
              <span className="tt-sig-key">{k.key} major</span>
              <span>{k.sfLabel}</span>
              <span className="tt-sig-notes">{k.accidentals.join(', ') || 'none'}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>Flat keys <span className="tt-clef-glyph">♭</span></h2>
        <p>
          Moving <strong>counter-clockwise</strong> adds one flat per step.
          Flats are added in the order <strong>B  E  A  D  G  C  F</strong> — the
          sharp order reversed. Mnemonic: <em>"Battle Ends And Down Goes Charles's Father."</em>
        </p>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header">
            <span>Key</span><span>Flats</span><span>Notes added</span>
          </div>
          {KEY_SIGS.filter(k => k.sf < 0).map(k => (
            <div key={k.key} className="tt-sig-row">
              <span className="tt-sig-key">{k.key} major</span>
              <span>{k.sfLabel}</span>
              <span className="tt-sig-notes">{k.accidentals.join(', ')}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>Quick identification shortcuts</h2>
        <ul className="tt-learn-list">
          <li>
            <strong>Sharp keys:</strong> the last sharp added is always one half-step below
            the tonic. Three sharps = F♯, C♯, G♯. Last sharp: G♯. One half-step above G♯ = A.
            Key: <strong>A major</strong>.
          </li>
          <li>
            <strong>Flat keys:</strong> the second-to-last flat is the key name.
            Three flats = B♭, E♭, A♭. Second-to-last: E♭. Key: <strong>E♭ major</strong>.
            One flat is a special case — always <strong>F major</strong>.
          </li>
          <li>
            <strong>No sharps or flats:</strong> always C major (or its relative, A minor).
          </li>
        </ul>
        <p className="tt-learn-tip">
          💡 Practise naming a key from its signature until you can do it in under two seconds —
          that speed is what allows real-time sight-reading.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function KeySigsQuiz() {
  const [mode, setMode]         = useState<KSMode>('major')
  const [question, setQuestion] = useState<KSQuestion>(() => ksPickQ('major'))
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore]       = useState(0)
  const [total, setTotal]       = useState(0)
  const [streak, setStreak]     = useState(0)
  const [best, setBest]         = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef     = useRef<number | null>(null)
  const modeRef      = useRef<KSMode>('major')
  modeRef.current    = mode

  // Render key signature whenever question changes
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try { renderQuizKeySig(el, question.entry.vfKey) } catch { /* ignore */ }
  }, [question])

  const switchMode = useCallback((m: KSMode) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    modeRef.current = m
    setMode(m)
    setQuestion(ksPickQ(m))
    setSelected(null)
    setScore(0); setTotal(0); setStreak(0); setBest(0)
  }, [])

  function advance(fromVfKey: string) {
    setQuestion(ksPickQ(modeRef.current, fromVfKey))
    setSelected(null)
  }

  function handleAnswer(choice: string) {
    if (selected !== null) return
    const correct = choice === question.answer
    setSelected(choice)
    setTotal(t => t + 1)
    if (correct) {
      setScore(s => s + 1)
      setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n })
    } else {
      setStreak(0)
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    if (correct) timerRef.current = window.setTimeout(() => advance(question.entry.vfKey), 650)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const accuracy = total > 0 ? Math.round((score / total) * 100) : null
  const sfCount  = Math.abs(question.entry.sf)
  const sfText   =
    question.entry.sf === 0 ? 'no accidentals'
    : question.entry.sf > 0 ? `${sfCount} sharp${sfCount !== 1 ? 's' : ''}`
    :                          `${sfCount} flat${sfCount !== 1 ? 's' : ''}`

  return (
    <div className="nq-root">

      {/* Mode buttons */}
      <div className="nq-mode-row">
        {(['major', 'minor', 'both'] as KSMode[]).map(m => (
          <button key={m} type="button"
            className={`nq-mode-btn${mode === m ? ' active' : ''}`}
            onClick={() => switchMode(m)}
          >
            {m === 'major' ? 'Major' : m === 'minor' ? 'Minor' : 'Both'}
          </button>
        ))}
      </div>

      {/* Score strip */}
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

      {/* Key signature display */}
      <div className="nq-staff-wrap">
        <div
          ref={containerRef}
          className={`nq-staff-svg${selected !== null
            ? (selected === question.answer ? ' nq-staff-correct' : ' nq-staff-wrong')
            : ''}`}
          style={{ maxWidth: '150px', overflow: 'visible' }}
        />
        <p className="nq-clef-label">{sfText}</p>
      </div>

      {/* Prompt */}
      <p className="nq-question">
        Which {question.asking} key has this key signature?
      </p>

      {/* Answer buttons */}
      <div className="nq-choices">
        {question.choices.map(choice => {
          const isCorrect  = choice === question.answer
          const isSelected = choice === selected
          let cls = 'nq-choice'
          if (selected !== null) {
            if (isSelected && isCorrect)  cls += ' nq-correct'
            else if (isSelected)          cls += ' nq-wrong'
            else if (isCorrect)           cls += ' nq-reveal'
          }
          return (
            <button key={choice} type="button" className={cls}
              onClick={() => handleAnswer(choice)} disabled={selected !== null}
            >
              {cls.split(' ').includes('nq-reveal') ? (
                <>
                  <span className="nq-reveal-top">correct answer</span>
                  <span className="nq-reveal-val">{choice}</span>
                </>
              ) : choice}
            </button>
          )
        })}
      </div>
      {selected !== null && selected !== question.answer && (
        <button
          type="button"
          className="nq-next-btn"
          onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); advance(question.entry.vfKey) }}
        >
          Next →
        </button>
      )}

      <p className="nq-hint">Sharps: F C G D A E B  ·  Flats: B E A D G C F</p>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function KeySignatures() {
  usePageTitle('Key Signatures')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Key Signatures</h1>
        <p className="tt-page-sub">
          Learn to read sharps and flats at a glance and identify any major key instantly.
        </p>
      </div>
      <TheoryTopicLayout
        overviewContent={<KeySignaturesOverview />}
        learnContent={<KeySigsLearnContent />}
        gamesContent={<KeySigsQuiz />}
        topicName="key signatures"
        gamesLabel="Practice"
      />
    </div>
  )
}
