/**
 * Secondary Dominants — theory topic page.
 */
import { TheoryTopicLayout } from '../../components/TheoryTopicLayout'
import { TheoryOverviewCard } from '../../components/TheoryOverviewCard'
import { TheoryQuiz, type QuizMode } from '../../components/TheoryQuiz'
import { usePageTitle } from '../../hooks/usePageTitle'

// ── Data ──────────────────────────────────────────────────────────────────────

interface SecDom {
  symbol: string       // e.g. "V/ii"
  roman: string        // target chord roman numeral: "ii"
  targetName: string   // e.g. "Dm" in C major
  chord: string        // e.g. "A7" in C major
  key: string          // e.g. "C major"
  keyNote: string      // tonic note
}

// All secondary dominants for C major (static reference, quiz rotates keys)
const C_MAJOR_SEC_DOMS: SecDom[] = [
  { symbol: 'V/ii',  roman: 'ii',  targetName: 'Dm', chord: 'A7',  key: 'C major', keyNote: 'C' },
  { symbol: 'V/iii', roman: 'iii', targetName: 'Em', chord: 'B7',  key: 'C major', keyNote: 'C' },
  { symbol: 'V/IV',  roman: 'IV',  targetName: 'F',  chord: 'C7',  key: 'C major', keyNote: 'C' },
  { symbol: 'V/V',   roman: 'V',   targetName: 'G',  chord: 'D7',  key: 'C major', keyNote: 'C' },
  { symbol: 'V/vi',  roman: 'vi',  targetName: 'Am', chord: 'E7',  key: 'C major', keyNote: 'C' },
]

const G_MAJOR_SEC_DOMS: SecDom[] = [
  { symbol: 'V/ii',  roman: 'ii',  targetName: 'Am', chord: 'E7',  key: 'G major', keyNote: 'G' },
  { symbol: 'V/IV',  roman: 'IV',  targetName: 'C',  chord: 'G7',  key: 'G major', keyNote: 'G' },
  { symbol: 'V/V',   roman: 'V',   targetName: 'D',  chord: 'A7',  key: 'G major', keyNote: 'G' },
  { symbol: 'V/vi',  roman: 'vi',  targetName: 'Em', chord: 'B7',  key: 'G major', keyNote: 'G' },
]

const F_MAJOR_SEC_DOMS: SecDom[] = [
  { symbol: 'V/ii',  roman: 'ii',  targetName: 'Gm',  chord: 'D7', key: 'F major', keyNote: 'F' },
  { symbol: 'V/IV',  roman: 'IV',  targetName: 'B♭',  chord: 'F7', key: 'F major', keyNote: 'F' },
  { symbol: 'V/V',   roman: 'V',   targetName: 'C',   chord: 'G7', key: 'F major', keyNote: 'F' },
  { symbol: 'V/vi',  roman: 'vi',  targetName: 'Dm',  chord: 'A7', key: 'F major', keyNote: 'F' },
]

const ALL_SEC_DOMS = [...C_MAJOR_SEC_DOMS, ...G_MAJOR_SEC_DOMS, ...F_MAJOR_SEC_DOMS]

function sdPick(pool: SecDom[], excludeKey?: string): SecDom {
  const filtered = excludeKey ? pool.filter(s => (s.symbol + s.key) !== excludeKey) : pool
  const p = filtered.length > 0 ? filtered : pool
  return p[Math.floor(Math.random() * p.length)]
}

function sdChoices(q: SecDom, pool: SecDom[], modeId: string): string[] {
  const answer = modeId === 'symbol-to-chord' ? q.chord : q.targetName
  const keyPool = pool.filter(s => s.key === q.key)
  const allVals = modeId === 'symbol-to-chord'
    ? [...new Set(keyPool.map(s => s.chord))]
    : [...new Set(keyPool.map(s => s.targetName))]
  const others = allVals.filter(v => v !== answer).sort(() => Math.random() - 0.5).slice(0, 3)
  return [...others, answer].sort(() => Math.random() - 0.5)
}

const HINT = 'V/X = the dominant 7th of chord X · V/V in C = D7 (resolves to G)'

const SD_MODES: QuizMode<SecDom>[] = [
  { id: 'symbol-to-chord', label: 'Symbol → Chord', pool: ALL_SEC_DOMS, hint: HINT },
  { id: 'chord-to-target', label: 'Symbol → Resolves to', pool: ALL_SEC_DOMS, hint: HINT },
]

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════════════════════

function LearnContent() {
  return (
    <div className="tt-learn">

      <section className="tt-learn-section">
        <h2>What is a secondary dominant?</h2>
        <p>
          Every major chord in a key can be preceded by <em>its own</em> dominant 7th chord —
          even if that chord doesn't belong to the key. This borrowed dominant is called a
          <strong> secondary dominant</strong>. It adds a brief but powerful pull toward a
          non-tonic chord.
        </p>
        <p>
          The notation <strong>V/X</strong> means "the V chord <em>of</em> X."
          So in C major, <strong>V/V</strong> means "the dominant of G" — which is D7.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>Secondary dominants in C major</h2>
        <div className="tt-sig-table">
          <div className="tt-sig-row tt-sig-header" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <span>Symbol</span><span>Chord</span><span>Resolves to</span>
          </div>
          {C_MAJOR_SEC_DOMS.map(sd => (
            <div key={sd.symbol} className="tt-sig-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <span className="tt-sig-key" style={{ fontFamily: 'Georgia, serif' }}>{sd.symbol}</span>
              <span className="tt-sig-notes">{sd.chord}</span>
              <span className="tt-sig-notes">{sd.targetName} ({sd.roman})</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 10, fontSize: '0.9rem', color: '#6c7a8d' }}>
          Notice that V/IV = C7 — a C major chord with a ♭7, which normally sounds like a blues move.
          That's exactly what it is! The IV chord (F) acts as the "tonic" and C7 is its dominant.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>How to build a secondary dominant</h2>
        <ol className="tt-learn-list">
          <li>Identify the target chord (e.g., ii = Dm in C major).</li>
          <li>Find the root a perfect 5th above that chord's root (D → A).</li>
          <li>Build a dominant 7th chord on that root (A7 = A–C♯–E–G).</li>
          <li>The resulting chord is V/ii — use it just before the ii chord.</li>
        </ol>
        <p className="tt-learn-tip">
          💡 A dominant 7th chord creates a strong pull to the chord a 5th below. Secondary dominants
          exploit this by temporarily treating any major (or minor) chord as a local tonic.
          Hear it in "I Will Survive" (E7–Am), "Hey Joe" (C–G–D–A–E7), and thousands of jazz standards.
        </p>
      </section>

      <section className="tt-learn-section">
        <h2>The most common secondary dominant</h2>
        <p>
          <strong>V/V</strong> (pronounced "five of five") is by far the most common.
          In C major it's D7, which pulls strongly to G, which then resolves to C.
          The result — <strong>I – V/V – V – I</strong> — is one of the oldest and most satisfying
          gestures in tonal music, found everywhere from Baroque to pop.
        </p>
        <p>
          Listen for the moment a song temporarily "sharpens" — that raised pitch is usually the
          major 3rd of a secondary dominant doing its job.
        </p>
      </section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

export function SDQuiz() {
  return (
    <TheoryQuiz<SecDom>
      modes={SD_MODES}
      pickQuestion={sdPick}
      getExcludeKey={q => q.symbol + q.key}
      pickChoices={sdChoices}
      getAnswer={(q, modeId) => modeId === 'symbol-to-chord' ? q.chord : q.targetName}
      renderQuestion={(q, modeId, selected, answer) => (
        <div className={`theory-q-card${selected !== null ? (selected === answer ? ' theory-q-correct' : ' theory-q-wrong') : ''}`}>
          <div className="theory-q-main" style={{ fontFamily: 'Georgia, serif' }}>{q.symbol}</div>
          <div className="theory-q-sub">
            {modeId === 'symbol-to-chord'
              ? <>What chord is this in <strong>{q.key}</strong>?</>
              : <>What chord does this resolve to in <strong>{q.key}</strong>?</>}
          </div>
        </div>
      )}
    />
  )
}

export function SecondaryDominants() {
  usePageTitle('Secondary Dominants')
  return (
    <div className="tt-page">
      <div className="tt-page-header">
        <h1>Secondary Dominants</h1>
        <p className="tt-page-sub">Borrow the dominant chord from any neighbouring key to create a powerful pull toward any diatonic chord.</p>
      </div>
      <TheoryTopicLayout
        overviewContent={<TheoryOverviewCard
          icon="🔀"
          title="Secondary Dominants"
          description="A secondary dominant is a dominant 7th chord borrowed from a related key that briefly tonicises a non-tonic chord. V/V means the dominant of the dominant — temporarily making IV sound like home before you return."
          keyFact="In C major, A7 is V/ii — it strongly pulls to Dm. This borrowed chord creates a chromatic colour not available in pure diatonic harmony."
          color="hsl(15, 75%, 45%)"
        />}
        learnContent={<LearnContent />}
        gamesContent={<SDQuiz />}
        topicName="secondary dominants"
        gamesLabel="Practice"
      />
    </div>
  )
}
