# Trying Something — Rhythm Trainer

**[tryingsomething.com](https://tryingsomething.com)**

You've stared at sheet music and felt that small panic — the notes make sense, but *when* do you play them? Trying Something is a rhythm trainer built to fix exactly that. Tap along to notated rhythms, hear your timing reflected back in real time, and watch the gap between "I see it" and "I feel it" shrink.

No signup required. Works in any browser. Installs as a PWA so it lives on your home screen like a real app.

---

## What it does

**Rhythm exercises** — Sheet music appears on screen. A metronome counts you in, then you tap. The app tells you how close you are to the beat and gives you a score. Nail it and move on; fumble it and try again. Exercises cover whole notes all the way through syncopation and dotted rhythms.

**Play Along** — Pick a BPM, choose a reel, and tap along to a musical phrase at your own pace. Bump the tempo up as you get comfortable. A game-over review shows you exactly where your timing drifted.

**Music Theory** — A growing section on note values, time signatures, and how rhythm actually works on a page. Written for players, not academics.

**Badges and progress** — Exercises track your personal bests. A dashboard shows where you've improved and what's still fighting back.

---

## Roadmap

- [x] Core rhythm trainer with live tap scoring
- [x] Play Along mode with BPM picker and session review
- [x] Badges and progress dashboard
- [x] Progressive Web App (installable, offline-capable)
- [ ] Music Theory fundamentals section
- [ ] Advanced sight-reading modules

---

## Running locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

Built with React, TypeScript, Vite, and VexFlow for music notation rendering.
