# Sheet Music Rhythm

A browser-based rhythm-training app. Users tap along to sheet music notation, earn progressive level unlocks, and practice with a free-play metronome mode. **No server required — all data lives in the browser's `localStorage`.**

---

## Running locally

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # output → frontend/dist/
```

---

## Architecture — the single most important thing to remember

**There is no backend.** `frontend/src/api/client.ts` has zero HTTP calls. Every operation (auth, exercise storage, attempt recording, level unlocking) is backed by `localStorage` through `frontend/src/lib/localDb.ts`.

The `backend/` directory exists on the `development-with-backend` branch only — it is **not present on `main` or `development`**.

```
frontend/src/
  api/
    client.ts          ← looks like an HTTP client but is entirely localStorage
    types.ts           ← shared TypeScript types
  auth/
    AuthContext.tsx    ← React context; session stored as rhythm:session in localStorage
  data/
    exercises.ts       ← THE source of truth for all exercises (not a database, not seed.py)
  lib/
    localDb.ts         ← raw localStorage get/save helpers; keys all prefixed rhythm:
    progression.ts     ← level unlock logic, remediation, custom exercise CRUD
    scoring.ts         ← free-tempo and strict-tempo tap scoring
    rhythm.ts          ← beat/onset math; eventBeats(), expectedOnsets(), tapCount()
    audio.ts           ← Web Audio tick engine (metronome, playback, tap clicks)
    vexflowPattern.ts  ← renders PatternEvent[] → VexFlow SVG
    rhythmGenerator.ts ← procedural rhythm generator for Play Along
    sheetMusicData.ts  ← hard-coded sheet music pieces for the Sheet Music Game
  pages/
    ExerciseList.tsx   ← level browser with skip-ahead buttons
    ExercisePlayer.tsx ← tap-along exercise view
    SheetMusicGame.tsx ← canvas-based scrolling score game
    PlayAlong.tsx      ← free metronome with scrolling VexFlow notation
    Dashboard.tsx      ← progress summary
    Learn.tsx          ← theory reference
    About.tsx
    admin/             ← admin panel (exercise manager, user table, test runner stub)
```

---

## localStorage key schema

All keys are prefixed `rhythm:` to avoid collisions.

| Key | Contents |
|-----|----------|
| `rhythm:users` | `LocalUser[]` — all registered accounts |
| `rhythm:session` | `{ userId: number }` — currently logged-in user |
| `rhythm:progress:{uid}` | `{ unlockedLevel: number }` |
| `rhythm:attempts:{uid}` | `LocalAttempt[]` — every tap attempt ever made |
| `rhythm:mastery:{uid}` | `{ [concept]: { passes, fails } }` |
| `rhythm:remediation:{uid}` | active remediation state or null |
| `rhythm:custom-exercises` | admin-created exercises (in addition to seed data) |
| `rhythm:nextid:{ns}` | auto-increment counter for each namespace |

To wipe all app data: `Object.keys(localStorage).filter(k => k.startsWith('rhythm:')).forEach(k => localStorage.removeItem(k))` in the browser console.

---

## Authentication

- Passwords are hashed with `crypto.subtle.digest('SHA-256')` before storage.
- The first account registered automatically gets `isAdmin = true`.
- The "token" is just `local:{userId}` stored in `rhythm:session`.
- Sessions survive page refresh; logging out clears the session key.

---

## Exercise data

All built-in exercises live in **`frontend/src/data/exercises.ts`** as a static TypeScript array (`SEED_EXERCISES`). This is the only place to add, edit, or remove built-in exercises. Do not look for a database or seed script on the `development` branch — there isn't one.

Custom exercises can be created via the admin panel (`/admin`); they go into `rhythm:custom-exercises` in localStorage.

### Exercise levels

| Level | Concept |
|-------|---------|
| 1 | Quarter & half notes |
| 2 | Whole notes & time signatures |
| 3 | Rests |
| 4 | Eighth notes |
| 5 | Dotted notes |
| 6 | Ties |
| 7 | Sixteenths & syncopation |
| 8 | Advanced syncopation & compound rhythm |

Pass **2 exercises at your highest unlocked level** to open the next level.

### Adding exercises

Add an entry to the `SEED_EXERCISES` array in `frontend/src/data/exercises.ts`. The `n()` and `r()` helpers create note and rest events. IDs must be unique integers; use the next integer after the current highest.

```ts
{ id: 33, title: 'My new exercise', level: 4, concept: 'eighth-notes',
  learn_section: 'eighth-notes', time_sig_top: 4, time_sig_bottom: 4,
  num_measures: 1, tempo_bpm: 90, is_active: true,
  pattern: { events: [n('q'), n('8'), n('8'), n('q'), n('q')] } }
```

---

## Scoring

Two modes:

- **Free** (`scoreTapsFree`): infers the user's own tempo from their taps, then scores relative timing. First tap is always "on time"; subsequent taps are measured against the inferred grid.
- **Strict** (`scoreTapsStrict`): taps are scored against the exercise's own `tempo_bpm` with no tempo inference.

Windows (in beats):
- `on_time` — within ±0.25 beats
- `early` / `late` — within ±0.5 beats
- `wrong` / `missed` — beyond ±0.5 beats

Pass threshold: **80% on-time notes**.

---

## Progression & remediation

After 3 consecutive failures on an exercise, the system starts a **remediation** session: it finds unpassed exercises with the same concept at an equal or lower level and routes the user there. After passing 2 remediation exercises the user is sent back to the original exercise.

`skipToLevel(userId, level)` in `progression.ts` force-unlocks a level (used by the "jump ahead" buttons on the exercise list).

---

## Play Along — `/rhythm/play-along`

No login required. A free-play metronome with a right-to-left scrolling strip of real VexFlow notation.

### How the scrolling reel works

- 24 unique measures are generated at module load time by `generateReel()` in `rhythmGenerator.ts`. The array is then doubled (`[...measures, ...measures]`) so the CSS animation can loop seamlessly: it runs from `translateX(0)` to `translateX(-50%)`, at which point the second copy is identical to the first.
- Each measure is exactly `SLOT_PX = 380px` wide, enforced by passing `fixedTotalWidth: SLOT_PX` to `renderPattern()`, which distributes all notes evenly across the fixed canvas width using VexFlow's formatter.
- `animationDuration` is set inline based on `bpm`: `REEL_UNIQUE × (4 × 60000 / bpm)` ms. This keeps the notation perfectly in sync with the metronome regardless of tempo.

### Procedural rhythm generation (`rhythmGenerator.ts`)

Patterns are generated with the **Mulberry32 seeded PRNG** — deterministic, so the same seed always produces the same sequence (stable React keys, no re-render jitter).

The generator uses a "fills by beat count" architecture:

| Table | Size | Example fills |
|-------|------|---------------|
| `ONE_BEAT` | 1 quarter note | `[n('q')]`, `[n('8'), n('8')]`, `[n('8',1), n('16')]` (gallop) |
| `TWO_BEAT` | 2 quarter notes | `[n('h')]`, `[n('q',1), n('8')]` (dotted-q+8th), `[r('q'), n('q')]` |
| `FOUR_BEAT` | 4 quarter notes | `[n('w')]`, `[r('w')]` |

`fillMeasure()` picks from whichever fills fit the remaining beat count. Because every fill has an integer beat count, `remaining` is always a whole number and the loop always terminates cleanly.

Each fill entry has a `minLevel` field. As difficulty rises, more entries become eligible:

| Level | New unlocks |
|-------|-------------|
| 1 | Quarter notes, rests, half notes, whole notes |
| 2 | Eighth-note pairs, half rests |
| 3 | Dotted-quarter + eighth (2-beat), eighth + dotted-quarter |
| 4 | Syncopated 2-beat cells (rest → note pairs) |
| 5 | Sixteenth groups, gallop `[n('8',1), n('16')]`, reverse gallop |

Difficulty ramps 1 → 5 across each 20-measure cycle (`level = floor((i % 20) / 4) + 1`).

### Mixed time signatures

At lower levels only 4/4 appears. Higher levels introduce 3/4 and 6/8:

| Level | 4/4 | 3/4 | 6/8 |
|-------|-----|-----|-----|
| 1–2 | 100% | — | — |
| 3 | 80% | 20% | — |
| 4 | 72% | 28% | — |
| 5 | 60% | 22% | 18% |

6/8 is treated as 3 quarter-note beats internally (6 × 4/8 = 3), so VexFlow renders it correctly without special-casing.

### Connected stave rendering

Consecutive measures that share the same time signature show **only barlines** — no repeated percussion clef or time signature. When the time signature changes, the new measure shows both. This is controlled by `showClef` and `showTimeSig` booleans computed in `generateReel()` and passed to `renderPattern()` via its `options` parameter.

---

## Sheet Music Game — `/rhythm/game`

Canvas-based game where real public-domain pieces scroll past. Tap the TAP button on each note head. Hits turn green, misses turn red. 10 reds and the game resets.

Pieces are defined in `frontend/src/lib/sheetMusicData.ts` as `SheetPiece` objects with a `notes` array of `{ measure, beat, type, yPos }`. Currently includes *Ode to Joy*, *Twinkle Twinkle*, and *Mary Had a Little Lamb*. To add a piece, add a new entry to the `PIECES` array in that file and it will automatically appear in the exercise list promo and the game's piece selector.

---

## Admin panel — `/admin`

First registered user is admin. Admin can:
- Browse all users and their attempt history
- Create, edit, and delete custom exercises (stored in localStorage, not `exercises.ts`)
- View a test-runner UI (backend-only; shows a stub error message in this build)

---

## Audio engine (`audio.ts`)

All sound is routed through a single `masterGain` node so that `cancelAll()` can instantly silence pre-scheduled audio by zeroing the gain. Three click kinds:

| Kind | Wave | Frequency |
|------|------|-----------|
| `tap` | square | 1000 Hz |
| `playback` | square | 1500 Hz |
| `metronome` | triangle | 620 Hz |

The metronome schedules beats with a 200 ms lookahead window to stay jitter-free.

---

## VexFlow notation (`vexflowPattern.ts`)

`renderPattern(container, pattern, timeSigTop, timeSigBottom, options)` renders a `Pattern` (array of `PatternEvent`) into a `<div>` as inline SVG. Options:

| Option | Default | Effect |
|--------|---------|--------|
| `showTimeSignature` | `true` | Show or hide the time signature on the first measure |
| `showClef` | `true` | Show or hide the percussion clef on the first measure |
| `fixedTotalWidth` | `undefined` | Force the entire score to this pixel width (measures split evenly) |

Returns `{ width, height, anchors[] }` where `anchors` are pixel positions of each note head (used to overlay feedback dots in the exercise player).

---

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready, localStorage-only |
| `development` | Active development target |
| `development-with-backend` | Archived: FastAPI backend + PostgreSQL + Alembic migrations |
