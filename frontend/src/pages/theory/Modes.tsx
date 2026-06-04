/**
 * Modes as Tonal Centers — theory topic page.
 */
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz, type QuizMode } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

interface Mode {
  name: string
  degree: number       // which degree of the major scale it starts on
  pattern: string      // W/H pattern
  character: string    // sonic quality description
  examples: string     // songs or genres
  relativeToMajor: string  // how it differs from major
}

const MODES: Mode[] = [
  {
    name: 'Ionian',
    degree: 1,
    pattern: 'W–W–H–W–W–W–H',
    character: 'Bright, stable, happy',
    examples: 'Most major key songs; "Happy Birthday"',
    relativeToMajor: 'This IS the major scale',
  },
  {
    name: 'Dorian',
    degree: 2,
    pattern: 'W–H–W–W–W–H–W',
    character: 'Minor but with a bright 6th — jazzy, soulful',
    examples: '"So What" (Miles Davis), "Scarborough Fair", funk basslines',
    relativeToMajor: 'Minor scale with raised 6th',
  },
  {
    name: 'Phrygian',
    degree: 3,
    pattern: 'H–W–W–W–H–W–W',
    character: 'Dark, Spanish, tense — the ♭2 is its signature',
    examples: 'Flamenco, metal, "White Zombie" riffs',
    relativeToMajor: 'Minor scale with lowered 2nd',
  },
  {
    name: 'Lydian',
    degree: 4,
    pattern: 'W–W–W–H–W–W–H',
    character: 'Dreamy, floating, ethereal — the ♯4 lifts it',
    examples: 'John Williams film scores, "The Simpsons" theme, dream sequences',
    relativeToMajor: 'Major scale with raised 4th',
  },
  {
    name: 'Mixolydian',
    degree: 5,
    pattern: 'W–W–H–W–W–H–W',
    character: 'Major but bluesy — the ♭7 gives it a rock/folk edge',
    examples: '"Sweet Home Chicago", "Norwegian Wood", Celtic music',
    relativeToMajor: 'Major scale with lowered 7th',
  },
  {
    name: 'Aeolian',
    degree: 6,
    pattern: 'W–H–W–W–H–W–W',
    character: 'Dark, melancholic, natural minor',
    examples: 'Most minor key songs; "Stairway to Heaven" verse',
    relativeToMajor: 'This IS the natural minor scale',
  },
  {
    name: 'Locrian',
    degree: 7,
    pattern: 'H–W–W–H–W–W–W',
    character: 'Unstable, dissonant — the ♭5 on the tonic makes it hard to use as a tonal center',
    examples: 'Rarely used as tonal center; heard in jazz over m7♭5 chords',
    relativeToMajor: 'Minor scale with lowered 2nd AND 5th',
  },
]

type ModeQuestionType = 'degree-to-name' | 'name-to-character' | 'name-to-degree' | 'character-to-name'

interface ModeQuestion {
  mode: Mode
  type: ModeQuestionType
}

function mPick(excludeName?: string): ModeQuestion {
  const pool = excludeName ? MODES.filter(m => m.name !== excludeName) : MODES
  const mode = pool[Math.floor(Math.random() * pool.length)]
  const types: ModeQuestionType[] = ['degree-to-name', 'name-to-character', 'name-to-degree', 'character-to-name']
  const type = types[Math.floor(Math.random() * types.length)]
  return { mode, type }
}

function mChoices(q: ModeQuestion): string[] {
  const { type, mode } = q
  let answer: string
  let pool: string[]

  switch (type) {
    case 'degree-to-name':
    case 'character-to-name':
      answer = mode.name
      pool = MODES.map(m => m.name)
      break
    case 'name-to-degree':
      answer = String(mode.degree)
      pool = MODES.map(m => String(m.degree))
      break
    case 'name-to-character':
      answer = mode.relativeToMajor
      pool = MODES.map(m => m.relativeToMajor)
      break
  }

  const others = [...new Set(pool.filter(v => v !== answer))].sort(() => Math.random() - 0.5).slice(0, 3)
  return [...others, answer].sort(() => Math.random() - 0.5)
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>Modes: the same notes, a different story</h2>
        <p>
          Every major scale contains seven modes — one starting on each scale degree.
          All seven modes of C major use the exact same notes (C D E F G A B), but each one
          treats a different note as "home." That shift of tonal center changes everything:
          the intervals, the tensions, the characteristic sound.
        </p>
        <p>
          D Dorian uses the same notes as C major, but D is the root. The D–F minor 3rd, the D–G
          perfect 4th, the D–B major 6th — all create a different set of tensions and resolutions than
          C Ionian. Same notes; totally different world.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The seven modes</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '110px 60px 1fr' }}>
            <span>Mode</span><span>Degree</span><span>Character</span>
          </div>
          {MODES.map(mode => (
            <div key={mode.name} className="tt-sig-row" style={{ gridTemplateColumns: '110px 60px 1fr' }}>
              <span className="tt-sig-key">{mode.name}</span>
              <span className="tt-sig-notes">{mode.degree}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.85rem' }}>{mode.character}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>Modes vs the major scale</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '110px 1fr' }}>
            <span>Mode</span><span>How it differs from major</span>
          </div>
          {MODES.map(mode => (
            <div key={mode.name} className="tt-sig-row" style={{ gridTemplateColumns: '110px 1fr' }}>
              <span className="tt-sig-key">{mode.name}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.85rem' }}>{mode.relativeToMajor}</span>
            </div>
          ))}
        </div>
        <p className="tt-learn-tip">
          💡 The most musically useful modes to know first: <strong>Dorian</strong> (jazz/funk minor),
          <strong>Mixolydian</strong> (rock/Celtic major), and <strong>Lydian</strong> (dreamy/film).
          These three cover an enormous range of repertoire.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Using modes as independent tonal centers</h2>
        <p>
          To use D Dorian as a tonal center (not just "the notes of C major starting on D"), you need
          to <em>emphasise D as the root</em>. This means:
        </p>
        <ul className="tt-learn-list">
          <li>Starting and ending phrases on D</li>
          <li>Using a drone or pedal on D</li>
          <li>Choosing chords that make D feel like home (Dm, G, Dm, Bm♭5...)</li>
          <li>Avoiding V–I cadences back to C (which would make C Ionian re-assert itself)</li>
        </ul>
        <p>
          Modal jazz (like Miles Davis's "Kind of Blue") often stays on one chord or vamp for many bars,
          giving the soloist time to truly establish the mode as the tonal center — not just a brief
          colour borrowed from the parent major scale.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function mGetAnswer(q: ModeQuestion): string {
  switch (q.type) {
    case 'degree-to-name':
    case 'character-to-name': return q.mode.name
    case 'name-to-degree': return String(q.mode.degree)
    case 'name-to-character': return q.mode.relativeToMajor
  }
}

function mGetPrompt(q: ModeQuestion): string {
  switch (q.type) {
    case 'degree-to-name': return `Which mode starts on degree ${q.mode.degree} of the major scale?`
    case 'name-to-degree': return `${q.mode.name} mode starts on which degree of the major scale?`
    case 'name-to-character': return `How does ${q.mode.name} relate to the major scale?`
    case 'character-to-name': return `"${q.mode.character}" — which mode is this?`
  }
}

function mGetDisplay(q: ModeQuestion): string {
  switch (q.type) {
    case 'degree-to-name': return `Degree ${q.mode.degree}`
    case 'name-to-degree': return q.mode.name
    case 'name-to-character': return q.mode.name
    case 'character-to-name': return q.mode.character
  }
}

const MODES_QUIZ_MODE: QuizMode<ModeQuestion>[] = [
  {
    id: 'mixed',
    label: 'Mixed',
    pool: MODES.map(() => mPick()),
    hint: 'Ionian=1 · Dorian=2 · Phrygian=3 · Lydian=4 · Mixolydian=5 · Aeolian=6 · Locrian=7',
  },
]

function Quiz() {
  return (
    <TheoryQuiz<ModeQuestion>
      modes={MODES_QUIZ_MODE}
      pickQuestion={(_pool, excludeKey) => mPick(excludeKey)}
      getExcludeKey={(q) => q.mode.name}
      pickChoices={mChoices}
      getAnswer={mGetAnswer}
      renderQuestion={(q, _modeId, selected, answer) => (
        <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
          <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem' }}>{mGetDisplay(q)}</div>
          <div className="theory-q-sub">{mGetPrompt(q)}</div>
        </div>
      )}
    />
  )
}

export function ModesPage() {
  usePageTitle('Modes as Tonal Centers')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Modes as Tonal Centers</h1>
        <p className="tt-page-sub">Dorian, Phrygian, Lydian, Mixolydian — not just scale patterns but independent sonic worlds. The basis of modal jazz.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🌊"
          title="Modes"
          description="The seven modes are the seven rotations of the major scale. Each starts on a different degree and has a unique flavour: Dorian (jazzy minor), Phrygian (flamenco tension), Lydian (dreamy major), Mixolydian (bluesy major), Locrian (unstable)."
          keyFact="Dorian mode is the most common modal sound in jazz and rock. 'So What' by Miles Davis, 'Oye Como Va', and 'Smoke on the Water' are all Dorian."
          color="hsl(190, 65%, 40%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<Quiz />}
        topicName="modes"
        gamesLabel="Practice"
      />
    </div>
  )
}
