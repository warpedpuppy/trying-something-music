/**
 * Cadences — theory topic page.
 *
 * Learn   — what a cadence is; authentic, plagal, half, and deceptive cadences
 * Practice — identify the cadence type from a Roman numeral pair
 */

import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz, type QuizMode } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'
import { ProgressionPlayer } from '../../components/ProgressionPlayer'
import { CADENCE_SEQUENCES } from '../../lib/theoryAudio'

// ── Data ──────────────────────────────────────────────────────────────────────

type CadenceType = 'Authentic' | 'Plagal' | 'Half' | 'Deceptive'

interface Cadence {
  id: string
  numerals: string[]      // e.g. ['V', 'I']
  type: CadenceType
  description: string
}

const CADENCES: Cadence[] = [
  { id: 'V-I',    numerals: ['V',  'I' ],  type: 'Authentic',  description: 'Strong resolution to the tonic' },
  { id: 'V7-I',   numerals: ['V⁷', 'I' ],  type: 'Authentic',  description: 'Even stronger pull with the 7th' },
  { id: 'ii-I',   numerals: ['ii', 'I' ],  type: 'Authentic',  description: 'ii substitutes for IV → I' },
  { id: 'IV-I',   numerals: ['IV', 'I' ],  type: 'Plagal',     description: 'The "Amen" cadence — softer resolution' },
  { id: 'iv-I',   numerals: ['iv', 'I' ],  type: 'Plagal',     description: 'Minor subdominant to tonic' },
  { id: 'I-V',    numerals: ['I',  'V' ],  type: 'Half',       description: 'Phrase ends on the dominant — tension unresolved' },
  { id: 'ii-V',   numerals: ['ii', 'V' ],  type: 'Half',       description: 'Common setup for the dominant' },
  { id: 'IV-V',   numerals: ['IV', 'V' ],  type: 'Half',       description: 'Subdominant pulling toward dominant' },
  { id: 'V-vi',   numerals: ['V',  'vi'],  type: 'Deceptive',  description: 'Surprise! Avoids the expected I' },
  { id: 'V7-vi',  numerals: ['V⁷', 'vi'],  type: 'Deceptive',  description: 'V7 resolving unexpectedly to vi' },
]

const TYPES: CadenceType[] = ['Authentic', 'Plagal', 'Half', 'Deceptive']

const TYPE_COLOR: Record<CadenceType, string> = {
  Authentic:  'var(--green)',
  Plagal:     'var(--accent)',
  Half:       'var(--amber)',
  Deceptive:  '#9333ea',
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function CadencesLearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a cadence?</h2>
        <p>
          A <strong>cadence</strong> is a chord progression that marks the end of a musical
          phrase — the punctuation of music. Just as a sentence ends with a period, question
          mark, or comma, phrases end with cadences that signal rest, tension, or surprise.
        </p>
        <p>
          Cadences are described using <strong>Roman numerals</strong> that show the
          function of each chord within the key. The same cadence pattern works identically
          in every major key.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Authentic cadence — V → I <span className="tt-clef-glyph" style={{ color: 'var(--green)' }}>✓</span></h2>
        <p>
          The most conclusive cadence in tonal music. The dominant chord (V) resolves to
          the tonic (I), creating a sense of complete rest and finality — like the last word
          of a sentence followed by a period.
        </p>
        <p>
          When V has its 7th added (V⁷ → I), the pull is even stronger because the tritone
          inside the V⁷ chord wants to resolve inward to the tonic. This is called a
          <strong> perfect authentic cadence</strong> and is the most final-sounding ending
          in Western music.
        </p>
        <ProgressionPlayer steps={CADENCE_SEQUENCES.authentic} buttonLabel="▶ Hear V⁷ → I" context="in C major" />
      </section>

      <section className="tt-learn-section">
        <h2>Plagal cadence — IV → I <span className="tt-clef-glyph" style={{ color: 'var(--accent)' }}>♩</span></h2>
        <p>
          The subdominant (IV) moves to the tonic (I). Softer and less decisive than the
          authentic cadence — it feels more like a gentle settling than a firm landing.
          Also called the <strong>"Amen" cadence</strong> because hymns traditionally end
          with the word "A-men" sung over IV–I.
        </p>
        <ProgressionPlayer steps={CADENCE_SEQUENCES.plagal} buttonLabel="▶ Hear IV → I" context="in C major" />
      </section>

      <section className="tt-learn-section">
        <h2>Half cadence — ends on V <span className="tt-clef-glyph" style={{ color: 'var(--amber)' }}>?</span></h2>
        <p>
          Any cadence that <em>ends</em> on the dominant (V) is a half cadence. Like a
          question mark — it creates tension that demands a follow-up phrase.
          Common setups include I→V, ii→V, and IV→V.
        </p>
        <p>
          Half cadences often appear at the end of the first half of a musical sentence,
          with an authentic cadence completing the thought at the end of the second half.
        </p>
        <ProgressionPlayer steps={CADENCE_SEQUENCES.half} buttonLabel="▶ Hear I → V" context="phrase left unresolved" />
      </section>

      <section className="tt-learn-section">
        <h2>Deceptive cadence — V → vi <span className="tt-clef-glyph" style={{ color: '#9333ea' }}>!</span></h2>
        <p>
          The dominant (V) resolves — but not to I as expected. Instead it moves to vi
          (the relative minor), creating a moment of surprise. The listener's ear expected
          the phrase to end; instead the music continues in an unexpected direction.
        </p>
        <p>
          Composers use deceptive cadences to extend phrases, avoid monotony, and create
          emotional depth. Listen for them in the climactic moments of songs where the
          resolution is delayed for dramatic effect.
        </p>
        <ProgressionPlayer steps={CADENCE_SEQUENCES.deceptive} buttonLabel="▶ Hear the surprise" context="I → V⁷ → vi — wait for the twist" />
        <p className="tt-learn-tip">
          💡 All four cadences share a crucial feature: the dominant (V) appears in three
          of them. Recognising when you're on V — and watching where it goes next — is the
          key skill for identifying cadences in real music.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

function cadPickQuestion(pool: Cadence[], excludeId?: string): Cadence {
  const candidates = excludeId ? pool.filter(c => c.id !== excludeId) : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function cadPickChoices(_q: Cadence, _pool: Cadence[]): string[] {
  const correct = _q.type
  const others = TYPES.filter(t => t !== correct).sort(() => Math.random() - 0.5)
  return [...others, correct].sort(() => Math.random() - 0.5)
}

const CADENCES_MODE: QuizMode<Cadence>[] = [
  {
    id: 'identify',
    label: 'Identify',
    pool: CADENCES,
    hint: 'V→I Authentic · IV→I Plagal · ends on V = Half · V→vi Deceptive',
  },
]

export function CadencesQuiz() {
  return (
    <TheoryQuiz<Cadence>
      modes={CADENCES_MODE}
      pickQuestion={cadPickQuestion}
      getExcludeKey={(q) => q.id}
      pickChoices={cadPickChoices}
      getAnswer={(q) => q.type}
      renderQuestion={(q, _modeId, selected, answer) => {
        const isCorrect = selected !== null && selected === answer
        return (
          <div className={`theory-q-card${selected !== null ? (isCorrect ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
            <div className="theory-q-pair">
              {q.numerals.map((n, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {i > 0 && <span className="theory-q-arrow">→</span>}
                  <span className="theory-q-numeral">{n}</span>
                </span>
              ))}
            </div>
            <div className="theory-q-sub">{q.description}</div>
            {selected !== null && (
              <div className="theory-q-verdict" style={{ color: isCorrect ? 'var(--green)' : 'var(--red)' }}>
                {isCorrect ? `✓ ${q.type} cadence` : `✗ This is a ${q.type} cadence`}
              </div>
            )}
          </div>
        )
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function Cadences() {
  usePageTitle('Cadences')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Cadences</h1>
        <p className="tt-page-sub">
          The punctuation of music — how phrases begin, pause, and come to rest.
        </p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🏁"
          title="Cadences"
          description="A cadence is a harmonic punctuation mark — a chord progression that signals the end (or middle) of a musical phrase. The V→I authentic cadence is the most powerful resolution in western music."
          keyFact="The tension of V7 (dominant seventh) pulling to I (tonic) is the engine behind nearly all tonal music."
          color="hsl(340, 70%, 45%)"
        />}
        learnContent={<CadencesLearnContent />}
        gamesContent={<CadencesQuiz />}
        topicName="cadences"
        gamesLabel="Practice"
      />
    </div>
  )
}
