/**
 * Chord Progressions — theory topic page.
 *
 * Learn   — common progressions, why they work, Roman numeral thinking
 * Practice — fill-in-the-blank: identify the missing chord in a progression
 */

import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz, type QuizMode } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'
import { ProgressionPlayer } from '../../components/ProgressionPlayer'
import { PROGRESSION_SEQUENCES } from '../../lib/theoryAudio'

// ── Data ──────────────────────────────────────────────────────────────────────

interface Progression {
  id: string
  chords: string[]
  name: string
  examples: string
}

const BASE_PROGRESSIONS: Progression[] = [
  { id: 'I-IV-V-I',    chords: ['I',  'IV', 'V',  'I' ],  name: 'I–IV–V–I',          examples: 'Blues, rock, classical' },
  { id: 'I-V-vi-IV',   chords: ['I',  'V',  'vi', 'IV'],   name: 'I–V–vi–IV',         examples: '"Let It Be", "No Woman No Cry", hundreds of pop songs' },
  { id: 'I-vi-IV-V',   chords: ['I',  'vi', 'IV', 'V' ],   name: 'I–vi–IV–V',         examples: '"Stand By Me", "Blue Moon", doo-wop' },
  { id: 'vi-IV-I-V',   chords: ['vi', 'IV', 'I',  'V' ],   name: 'vi–IV–I–V',         examples: '"Africa" (Toto), "Someone Like You"' },
  { id: 'I-iii-IV-V',  chords: ['I',  'iii','IV', 'V' ],   name: 'I–iii–IV–V',        examples: 'Common in rock and country' },
  { id: 'ii-V-I',      chords: ['ii', 'V',  'I',  'I' ],   name: 'ii–V–I',            examples: 'The jazz cadence — in every standard' },
  { id: 'I-IV-I-V',    chords: ['I',  'IV', 'I',  'V' ],   name: 'I–IV–I–V',          examples: '12-bar blues skeleton' },
  { id: 'I-IV-vi-V',   chords: ['I',  'IV', 'vi', 'V' ],   name: 'I–IV–vi–V',         examples: 'Variations on the pop axis' },
]

// All possible choice values (unique chord symbols that appear in progressions)
const ALL_CHORDS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']

// ── Roman numeral descriptions ─────────────────────────────────────────────────

const CHORD_INFO: Record<string, string> = {
  'I':    'Tonic — home base, most stable',
  'ii':   'Supertonic — often leads to V',
  'iii':  'Mediant — connecting chord',
  'IV':   'Subdominant — moves away from home',
  'V':    'Dominant — strong pull back to I',
  'vi':   'Submediant — relative minor, emotional',
  'vii°': 'Leading tone diminished — very unstable',
}

// ── Generate all quiz questions from progressions × blank positions ────────────

interface ProgQuestion {
  id: string
  progression: Progression
  blankIndex: number
  answer: string
}

const ALL_QUESTIONS: ProgQuestion[] = BASE_PROGRESSIONS.flatMap(prog =>
  prog.chords.map((chord, idx) => ({
    id: `${prog.id}[${idx}]`,
    progression: prog,
    blankIndex: idx,
    answer: chord,
  }))
)

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function ProgressionsLearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a chord progression?</h2>
        <p>
          A <strong>chord progression</strong> is a sequence of chords played in order.
          Progressions are the harmonic backbone of virtually every piece of music —
          they create the emotional journey from tension to release that makes music feel
          satisfying.
        </p>
        <p>
          In tonal music, chords are described by their position in the scale using
          <strong> Roman numerals</strong>. Uppercase = major, lowercase = minor.
          This means the same I–V–vi–IV pattern sounds identical in C, G, or F♯ —
          only the actual pitch changes, not the relationships.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The diatonic chords of any major key</h2>
        <div className="tt-roman-row">
          {['I','ii','iii','IV','V','vi','vii°'].map(r => (
            <span key={r} className={`tt-roman-pill ${r === r.toUpperCase() && !r.includes('°') ? 'tt-roman-major' : 'tt-roman-minor'}`}>
              {r}
            </span>
          ))}
        </div>
        <p className="tt-roman-note">
          Uppercase = major chord &nbsp;·&nbsp; lowercase = minor chord &nbsp;·&nbsp; ° = diminished
        </p>
        <div className="tt-sig-table" style={{ marginTop: 16 }}>
          <div className="tt-sig-row tt-sig-header">
            <span>Numeral</span><span>Function</span>
          </div>
          {Object.entries(CHORD_INFO).map(([num, desc]) => (
            <div key={num} className="tt-sig-row">
              <span className="tt-sig-key" style={{ fontFamily: 'Georgia, serif' }}>{num}</span>
              <span className="tt-sig-notes">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>Essential progressions to know</h2>
        <ul className="tt-learn-list">
          <li>
            <strong>I–IV–V–I</strong> — The foundation of the blues, rock, and classical
            harmony. The three primary chords (I, IV, V) cover every scale degree, which
            is why they harmonise almost any melody.
            <ProgressionPlayer steps={PROGRESSION_SEQUENCES['I-IV-V-I']} buttonLabel="▶ Hear I–IV–V–I" context="in C" />
          </li>
          <li>
            <strong>I–V–vi–IV</strong> — The modern pop progression. I is home, V creates
            tension, vi adds emotional depth, IV provides contrast before returning to I.
            Used in thousands of contemporary songs.
            <ProgressionPlayer steps={PROGRESSION_SEQUENCES['I-V-vi-IV']} buttonLabel="▶ Hear I–V–vi–IV" context="in C" />
          </li>
          <li>
            <strong>ii–V–I</strong> — The jazz cadence. The ii chord sets up the V, which
            resolves to I with maximum tension and release. Every jazz standard uses this
            in some form.
            <ProgressionPlayer steps={PROGRESSION_SEQUENCES['ii-V-I']} buttonLabel="▶ Hear ii–V–I" context="in C" />
          </li>
          <li>
            <strong>I–vi–IV–V</strong> — The "50s progression" (doo-wop). The vi chord
            (relative minor) gives it an emotional tug before IV and V push back home.
            <ProgressionPlayer steps={PROGRESSION_SEQUENCES['I-vi-IV-V']} buttonLabel="▶ Hear I–vi–IV–V" context="in C" />
          </li>
        </ul>
        <p className="tt-learn-tip">
          💡 Instead of memorising chord names in every key separately, internalise the
          Roman numeral relationships. Once you know I–V–vi–IV, you can play it in all
          12 keys immediately by finding the right root and building from there.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Why do these progressions work?</h2>
        <p>
          The strongest harmonic motion in tonal music is <strong>down a fifth</strong>
          (or equivalently, up a fourth): V→I, ii→V, vi→ii. This is why ii–V–I feels so
          satisfying — it chains two downward-fifth movements in a row.
        </p>
        <p>
          The IV chord moves <em>away</em> from home (subdominant direction), creating
          tension that makes the return to I feel earned. The vi chord borrows emotional
          colour from the relative minor without fully leaving the key. These are the
          mechanics behind why certain progressions feel inevitable.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function progPickQuestion(excludeId?: string): ProgQuestion {
  const pool = excludeId
    ? ALL_QUESTIONS.filter(q => q.id !== excludeId)
    : ALL_QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

function progPickChoices(correct: string): string[] {
  const others = ALL_CHORDS
    .filter(c => c !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  return [...others, correct].sort(() => Math.random() - 0.5)
}

const PROGRESSIONS_MODE: QuizMode<ProgQuestion>[] = [
  {
    id: 'fill-in',
    label: 'Fill In',
    pool: ALL_QUESTIONS,
    hint: 'I = tonic · IV = subdominant · V = dominant · vi = relative minor',
  },
]

export function ProgressionsQuiz() {
  return (
    <TheoryQuiz<ProgQuestion>
      modes={PROGRESSIONS_MODE}
      pickQuestion={(pool, excludeKey) => {
        const candidates = excludeKey ? pool.filter(q => q.id !== excludeKey) : pool
        return candidates[Math.floor(Math.random() * candidates.length)]
      }}
      getExcludeKey={(q) => q.id}
      pickChoices={(q) => progPickChoices(q.answer)}
      getAnswer={(q) => q.answer}
      renderQuestion={(q, _modeId, selected, answer) => {
        const isCorrect = selected !== null && selected === answer
        return (
          <>
            <p className="nq-question" style={{ marginBottom: 4 }}>Fill in the missing chord:</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', margin: '0 0 16px' }}>
              {q.progression.name} — {q.progression.examples}
            </p>
            <div className="theory-q-prog">
              {q.progression.chords.map((chord, i) => {
                const isBlank = i === q.blankIndex
                const isReveal = selected !== null && isBlank
                return (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i > 0 && <span className="theory-q-prog-sep">–</span>}
                    <span className={`theory-q-prog-chord${isBlank ? ' theory-q-prog-blank' : ''}${isReveal ? (isCorrect ? ' theory-q-prog-reveal-correct' : ' theory-q-prog-reveal-wrong') : ''}`}>
                      {isBlank ? (selected ?? '?') : chord}
                    </span>
                  </span>
                )
              })}
            </div>
          </>
        )
      }}
      correctDelayMs={700}
      choiceButtonStyle={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function ChordProgressions() {
  usePageTitle('Chord Progressions')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Chord Progressions</h1>
        <p className="tt-page-sub">
          The harmonic patterns that drive tonal music — and why they feel inevitable.
        </p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🔄"
          title="Chord Progressions"
          description="A chord progression is a sequence of chords that creates the harmonic backdrop of a song. The same four chords — I, V, vi, IV — underpin thousands of popular songs in every genre."
          keyFact="I–V–vi–IV in C major: C–G–Am–F. Recognise it? It's in 'Let It Be', 'No Woman No Cry', 'With or Without You', and hundreds more."
          color="hsl(160, 60%, 38%)"
        />}
        learnContent={<ProgressionsLearnContent />}
        gamesContent={<ProgressionsQuiz />}
        topicName="chord progressions"
        gamesLabel="Practice"
      />
    </div>
  )
}
