/**
 * Form & Structure — theory topic page.
 */
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz, type QuizMode } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

interface MusicalForm {
  name: string
  label: string       // e.g. "AB" or "ABA"
  description: string
  examples: string
}

const FORMS: MusicalForm[] = [
  {
    name: 'Binary',
    label: 'AB',
    description: 'Two contrasting sections, each usually repeated. The A section often ends on the dominant; B returns to the tonic.',
    examples: 'Bach minuets, folk dances, early 18th-century dance movements',
  },
  {
    name: 'Rounded binary',
    label: 'ABA\'',
    description: 'Binary form where the B section leads back to a partial return of A — a hybrid of binary and ternary.',
    examples: 'Many minuets and scherzi; common in Classical period dance movements',
  },
  {
    name: 'Ternary',
    label: 'ABA',
    description: 'Three sections: statement, contrast, return. The return of A creates a satisfying sense of closure after the contrasting B.',
    examples: 'Song forms, da capo arias, marches, "Für Elise" (Beethoven)',
  },
  {
    name: 'Rondo',
    label: 'ABACADA…',
    description: 'A recurring main theme (A) alternates with contrasting episodes (B, C, D…). The A theme always returns home.',
    examples: 'Final movements of Classical concertos and sonatas; "Für Elise" (debated); many light pieces',
  },
  {
    name: 'Theme and variations',
    label: 'A A¹ A² A³…',
    description: 'A theme is stated, then repeated in progressively altered versions — new rhythms, harmonisations, textures, or countermelodies.',
    examples: 'Beethoven\'s "Ode to Joy" theme, Handel\'s "The Harmonious Blacksmith", jazz standards with choruses',
  },
  {
    name: 'Sonata-allegro',
    label: 'Expo / Dev / Recap',
    description: 'Exposition (two contrasting themes in different keys) → Development (fragmentation and modulation) → Recapitulation (both themes return in the home key).',
    examples: 'First movements of Classical/Romantic symphonies, sonatas, and string quartets',
  },
  {
    name: 'AABA (32-bar)',
    label: 'AABA',
    description: 'Four 8-bar sections: A (main theme), A (repeated), B (bridge — contrast and tension), A (return). Each A and B is typically 8 bars, making 32 bars total.',
    examples: '"Over the Rainbow," "I Got Rhythm," "All the Things You Are," most Great American Songbook standards',
  },
  {
    name: 'Verse-chorus',
    label: 'V–C–V–C–B–C',
    description: 'Alternating verses (narrative, changes each time) and choruses (refrain, same lyrics and melody). A bridge provides contrast before the final chorus.',
    examples: 'Virtually all modern pop music; rock songs; "Yesterday" (Beatles), "Bohemian Rhapsody" (mostly)',
  },
  {
    name: '12-bar blues',
    label: 'I7–IV7–V7',
    description: 'A 12-measure harmonic cycle (I7×4, IV7×2, I7×2, V7, IV7, I7, V7) that repeats indefinitely. Text and melody vary; the form is constant.',
    examples: '"Johnny B. Goode," "Pride and Joy," "Everyday I Have the Blues"; basis of early rock and roll',
  },
  {
    name: 'Through-composed',
    label: 'ABCDE…',
    description: 'No section repeats; new music from beginning to end. Allows the music to follow the text or narrative without repetition.',
    examples: '"Der Erlkönig" (Schubert), many art songs (lieder), film scores',
  },
]

interface FormQuestion {
  form: MusicalForm
  type: 'name-to-label' | 'label-to-name' | 'example-to-name'
}

function fPick(excludeName?: string): FormQuestion {
  const pool = excludeName ? FORMS.filter(f => f.name !== excludeName) : FORMS
  const form = pool[Math.floor(Math.random() * pool.length)]
  const types: FormQuestion['type'][] = ['name-to-label', 'label-to-name', 'example-to-name']
  const type = types[Math.floor(Math.random() * types.length)]
  return { form, type }
}

function fChoices(q: FormQuestion): string[] {
  let answer: string
  let pool: string[]

  if (q.type === 'name-to-label') {
    answer = q.form.label
    pool = FORMS.map(f => f.label)
  } else if (q.type === 'label-to-name') {
    answer = q.form.name
    pool = FORMS.map(f => f.name)
  } else {
    answer = q.form.name
    pool = FORMS.map(f => f.name)
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
        <h2>Why form matters</h2>
        <p>
          <strong>Musical form</strong> is the large-scale architecture of a piece — how repetition,
          contrast, and return are organised over time. Just as buildings have floors, rooms, and
          corridors, music has sections, themes, and transitions. Understanding form lets you
          navigate any piece: you know where you are, what's coming, and why the current moment feels
          the way it does.
        </p>
        <p>
          Form is also a compositional tool. When a piece repeats its opening material after a
          contrasting middle section, the return creates a powerful sense of recognition and arrival.
          When a verse-chorus song withholds the chorus for two verses, the first chorus lands with
          maximum impact. Form shapes the emotional arc of music across its entire length.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Common forms at a glance</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '150px 100px 1fr' }}>
            <span>Form</span><span>Label</span><span>Description</span>
          </div>
          {FORMS.map(f => (
            <div key={f.name} className="tt-sig-row" style={{ gridTemplateColumns: '150px 100px 1fr' }}>
              <span className="tt-sig-key">{f.name}</span>
              <span className="tt-sig-notes" style={{ fontFamily: 'Georgia, serif' }}>{f.label}</span>
              <span className="tt-sig-notes" style={{ fontSize: '0.82rem' }}>{f.description.split('.')[0]}.</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tt-learn-section">
        <h2>Sonata-allegro form in depth</h2>
        <p>
          Sonata-allegro form is the most architecturally complex standard form, and the backbone of
          Classical and Romantic instrumental music. Its three sections each have a specific dramatic role:
        </p>
        <ul className="tt-learn-list">
          <li><strong>Exposition:</strong> Introduces two contrasting themes — the first in the home key (tonic), the second in the dominant (or relative major). Sets up the conflict.</li>
          <li><strong>Development:</strong> Breaks the themes apart, combines fragments, modulates through distant keys, creates maximum tension. The most unpredictable section.</li>
          <li><strong>Recapitulation:</strong> Returns both themes, now both in the home key, resolving the harmonic tension of the exposition. Creates a sense of arrival and closure.</li>
        </ul>
        <p className="tt-learn-tip">
          💡 You can find sonata-allegro thinking in pop music too. The classic "problem–complication–resolution"
          narrative of a great song follows the same dramatic arc as Exposition–Development–Recapitulation.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>AABA — the jazz standard template</h2>
        <p>
          The 32-bar AABA form is the template for thousands of the most performed songs in the
          Western repertoire. Each A section presents the main melody and lyric; the B section
          (called the "bridge" or "release") offers harmonic and melodic contrast, typically moving
          to a different key area and lyric perspective.
        </p>
        <p>
          The structure creates a gentle drama: familiarity (A), familiarity (A), contrast and
          tension (B), then the reassuring return home (A). It's sophisticated enough to sustain
          interest yet predictable enough to feel inevitable — the perfect container for a song.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function fsGetAnswer(q: FormQuestion): string {
  if (q.type === 'name-to-label') return q.form.label
  return q.form.name
}

function fsGetPrompt(q: FormQuestion): string {
  if (q.type === 'name-to-label') return `What label represents ${q.form.name} form?`
  if (q.type === 'label-to-name') return `What form does the label "${q.form.label}" represent?`
  return `"${q.form.examples.split(',')[0].trim()}" — what form is this?`
}

function fsGetDisplay(q: FormQuestion): string {
  if (q.type === 'name-to-label') return q.form.name
  if (q.type === 'label-to-name') return q.form.label
  return q.form.examples.split(',')[0].trim()
}

const FORM_MODE: QuizMode<FormQuestion>[] = [
  {
    id: 'mixed',
    label: 'Mixed',
    pool: FORMS.map(() => fPick()),
    hint: 'AB=Binary · ABA=Ternary · ABACA=Rondo · AABA=32-bar · Expo/Dev/Recap=Sonata · V–C=Verse-Chorus',
  },
]

function Quiz() {
  return (
    <TheoryQuiz<FormQuestion>
      modes={FORM_MODE}
      pickQuestion={(_pool, excludeKey) => fPick(excludeKey)}
      getExcludeKey={(q) => q.form.name}
      pickChoices={fChoices}
      getAnswer={fsGetAnswer}
      renderQuestion={(q, _modeId, selected, answer) => (
        <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
          <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem' }}>{fsGetDisplay(q)}</div>
          <div className="theory-q-sub">{fsGetPrompt(q)}</div>
        </div>
      )}
    />
  )
}

export function FormAndStructure() {
  usePageTitle('Form & Structure')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Form &amp; Structure</h1>
        <p className="tt-page-sub">Binary, ternary, AABA, verse-chorus, sonata-allegro — how large-scale repetition and contrast shape an entire piece.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🏗️"
          title="Form & Structure"
          description="Musical form is the large-scale organisation of a piece — how sections relate and repeat. AABA (32-bar song form) and 12-bar blues are the two pillars of jazz and pop songwriting."
          keyFact="The AABA form (used in 'Over the Rainbow', 'Autumn Leaves', 'I Got Rhythm') creates tension through contrast: the B section (bridge) provides a harmonic escape before the final A section resolves."
          color="hsl(80, 55%, 38%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<Quiz />}
        topicName="form and structure"
        gamesLabel="Practice"
      />
    </div>
  )
}
