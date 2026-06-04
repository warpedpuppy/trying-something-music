/**
 * Notes & the Staff — theory topic page.
 *
 * Two tabs:
 *   Learn    — explanatory text, mnemonics, and staff diagrams
 *   Practice — multiple-choice note-name quiz using VexFlow notation
 */

import { useEffect, useRef } from 'react'
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryQuiz } from '../../components/TheoryQuiz'
import { renderSingleNote } from '../../lib/vexflowNote'
import { usePageTitle } from '../../hooks/usePageTitle'

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function MnemonicCard({
  kind,
  notes,
  phrase,
  isLine,
}: {
  kind: 'Lines' | 'Spaces'
  notes: string[]
  phrase: string
  isLine: boolean
}) {
  return (
    <div className="tt-mnemonic-card">
      <p className="tt-mnemonic-label">{kind} (bottom → top)</p>
      <div className="tt-notes-row">
        {notes.map((n, i) => (
          <span key={i} className={`tt-note-pill${isLine ? ' tt-pill-line' : ' tt-pill-space'}`}>
            {n}
          </span>
        ))}
      </div>
      <p className="tt-mnemonic-phrase">"{phrase}"</p>
    </div>
  )
}

function NotesLearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a staff?</h2>
        <p>
          Music is written on five horizontal lines called a <strong>staff</strong>.
          Each line and each gap between lines (called a <strong>space</strong>) represents
          a different pitch — as notes move up the staff, the pitch gets higher.
        </p>
        <p>
          A symbol at the left called a <strong>clef</strong> tells you which specific
          pitches each line and space represents. The two most common clefs are treble and bass.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The Treble Clef <span className="tt-clef-glyph">𝄞</span></h2>
        <p>
          Used for higher-pitched instruments — violin, flute, trumpet — and the
          right hand of the piano. The ornate curl wraps around the G line (the
          second line from the bottom), which is why it's also called the <em>G clef</em>.
        </p>
        <div className="tt-mnemonic-pair">
          <MnemonicCard
            kind="Lines"
            notes={['E','G','B','D','F']}
            phrase="Every Good Boy Does Fine"
            isLine
          />
          <MnemonicCard
            kind="Spaces"
            notes={['F','A','C','E']}
            phrase="FACE — it spells itself!"
            isLine={false}
          />
        </div>
        <p className="tt-learn-tip">
          💡 Together, the 9 treble positions spell out: E <em>F</em> G <em>A</em> B <em>C</em> D <em>E</em> F
          — just the note names in order from the bottom line upward.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The Bass Clef <span className="tt-clef-glyph">𝄢</span></h2>
        <p>
          Used for lower-pitched instruments — cello, bass guitar, tuba — and the
          left hand of the piano. The two dots straddle the F line (the fourth line
          from the bottom), so it's also called the <em>F clef</em>.
        </p>
        <div className="tt-mnemonic-pair">
          <MnemonicCard
            kind="Lines"
            notes={['G','B','D','F','A']}
            phrase="Good Boys Do Fine Always"
            isLine
          />
          <MnemonicCard
            kind="Spaces"
            notes={['A','C','E','G']}
            phrase="All Cows Eat Grass"
            isLine={false}
          />
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>Ledger lines</h2>
        <p>
          When a note is too high or too low for the five-line staff, short extra lines
          called <strong>ledger lines</strong> extend the staff just enough to place it.
          The most important ledger-line note is <strong>Middle C (C4)</strong> — it sits
          on a single ledger line just <em>below</em> the treble staff, or just <em>above</em> the bass staff.
          Middle C is where the two clefs meet.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>How to memorize them</h2>
        <ol className="tt-learn-list">
          <li>
            <strong>Lines first.</strong> Point at each line from bottom to top and say the
            mnemonic out loud: <em>Every Good Boy Does Fine</em>. Do this until it's automatic.
          </li>
          <li>
            <strong>Then spaces.</strong> Spaces are simply the notes between each pair of lines —
            once you know the lines, the spaces fall into place. <em>FACE</em> is easy to remember
            because it spells a word.
          </li>
          <li>
            <strong>Drill with the Practice tab.</strong> Start on "Treble Lines", aim for
            10 correct answers in a row before moving to "Treble Staff", and so on.
          </li>
          <li>
            <strong>Read real music.</strong> Even five minutes a day with actual sheet music
            reinforces these patterns faster than any drill.
          </li>
        </ol>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ (PRACTICE TAB)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Note definitions ──────────────────────────────────────────────────────────

interface QuizNote {
  key: string               // VexFlow key, e.g. 'e/4'
  name: string              // Letter name: 'E'
  clef: 'treble' | 'bass'
}

const TREBLE_LINES: QuizNote[] = [
  { key: 'e/4', name: 'E', clef: 'treble' },
  { key: 'g/4', name: 'G', clef: 'treble' },
  { key: 'b/4', name: 'B', clef: 'treble' },
  { key: 'd/5', name: 'D', clef: 'treble' },
  { key: 'f/5', name: 'F', clef: 'treble' },
]
const TREBLE_SPACES: QuizNote[] = [
  { key: 'f/4', name: 'F', clef: 'treble' },
  { key: 'a/4', name: 'A', clef: 'treble' },
  { key: 'c/5', name: 'C', clef: 'treble' },
  { key: 'e/5', name: 'E', clef: 'treble' },
]
const BASS_LINES: QuizNote[] = [
  { key: 'g/2', name: 'G', clef: 'bass' },
  { key: 'b/2', name: 'B', clef: 'bass' },
  { key: 'd/3', name: 'D', clef: 'bass' },
  { key: 'f/3', name: 'F', clef: 'bass' },
  { key: 'a/3', name: 'A', clef: 'bass' },
]
const BASS_SPACES: QuizNote[] = [
  { key: 'a/2', name: 'A', clef: 'bass' },
  { key: 'c/3', name: 'C', clef: 'bass' },
  { key: 'e/3', name: 'E', clef: 'bass' },
  { key: 'g/3', name: 'G', clef: 'bass' },
]

// ── Mode definitions ──────────────────────────────────────────────────────────

interface Mode {
  id: string
  label: string
  hint: string
  pool: QuizNote[]
}

const MODES: Mode[] = [
  {
    id: 'treble-lines',
    label: 'Treble Lines',
    hint: 'Every Good Boy Does Fine  —  E G B D F',
    pool: TREBLE_LINES,
  },
  {
    id: 'treble-all',
    label: 'Treble Staff',
    hint: 'Lines: EGBDF  ·  Spaces: FACE',
    pool: [...TREBLE_LINES, ...TREBLE_SPACES],
  },
  {
    id: 'bass-lines',
    label: 'Bass Lines',
    hint: 'Good Boys Do Fine Always  —  G B D F A',
    pool: BASS_LINES,
  },
  {
    id: 'bass-all',
    label: 'Bass Staff',
    hint: 'Lines: GBDFA  ·  Spaces: ACEG',
    pool: [...BASS_LINES, ...BASS_SPACES],
  },
  {
    id: 'both-clefs',
    label: 'Both Clefs',
    hint: 'Treble + Bass — all lines and spaces',
    pool: [...TREBLE_LINES, ...TREBLE_SPACES, ...BASS_LINES, ...BASS_SPACES],
  },
]

const ALL_NOTE_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickNote(pool: QuizNote[], lastId?: string): QuizNote {
  const candidates = pool.length > 1
    ? pool.filter(n => n.key + n.clef !== lastId)
    : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function pickChoices(correct: QuizNote): string[] {
  const wrong = ALL_NOTE_NAMES
    .filter(n => n !== correct.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  return [...wrong, correct.name].sort(() => Math.random() - 0.5)
}

// ── NoteStaffDisplay sub-component ───────────────────────────────────────────

function NoteStaffDisplay({ q, selected, answer }: { q: QuizNote; selected: string | null; answer: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) {
      try { renderSingleNote(ref.current, q.key, q.clef) } catch { /* ignore */ }
    }
  }, [q])
  const feedback = selected !== null ? (selected === answer ? ' nq-staff-correct' : ' nq-staff-wrong') : ''
  return (
    <div className="nq-staff-wrap">
      <div ref={ref} className={`nq-staff-svg${feedback}`} />
      <p className="nq-clef-label">{q.clef === 'treble' ? '𝄞 Treble clef' : '𝄢 Bass clef'}</p>
    </div>
  )
}

// ── Quiz component ────────────────────────────────────────────────────────────

function NotesQuiz() {
  return (
    <TheoryQuiz<QuizNote>
      modes={MODES}
      pickQuestion={(pool, excludeKey) => pickNote(pool, excludeKey)}
      getExcludeKey={(q) => q.key + q.clef}
      pickChoices={(q) => pickChoices(q)}
      getAnswer={(q) => q.name}
      renderQuestion={(q, _modeId, selected, answer) => (
        <>
          <NoteStaffDisplay q={q} selected={selected} answer={answer} />
          <p className="nq-question">What note is this?</p>
        </>
      )}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

import { NotesAndStaffOverview } from './NotesAndStaffOverview'

export function NotesAndStaff() {
  usePageTitle('Notes & the Staff')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Notes &amp; the Staff</h1>
        <p className="tt-page-sub">
          Learn to read and name notes on the treble and bass clef.
        </p>
      </div>
      <TheoryTopicLayout
        overviewContent={<NotesAndStaffOverview />}
        learnContent={<NotesLearnContent />}
        gamesContent={<NotesQuiz />}
        topicName="notes &amp; the staff"
        gamesLabel="Practice"
      />
    </div>
  )
}
