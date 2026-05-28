import { useEffect, useRef } from 'react'
import { triggerRipple } from '../lib/rippleEngine'
import {
  NUM_MEASURES, NOTE_MARGIN,
  type NoteType, type MeasureNote,
  makeMeasures, buildScrollData,
} from '../lib/musicNoteEngine'
import { getBeatLabel } from '../lib/rhythm'

const LINE_GAP = 12      // px between staff lines — visual only, not timing-critical

// ── Ripple burst ──────────────────────────────────────────────────────────────
const BURST_COUNT = 5

function triggerRippleBurst(x: number, y: number, vx: number) {
  for (let i = 0; i < BURST_COUNT; i++) {
    const hue       = Math.random() * 360
    const sat       = 75 + Math.random() * 20          // 75–95 %
    const lit       = 52 + Math.random() * 18          // 52–70 %
    const color     = `hsl(${Math.round(hue)},${Math.round(sat)}%,${Math.round(lit)}%)`
    const speed     = 0.07 + Math.random() * 0.38      // 0.07–0.45  (all dreamily slow)
    const lineWidth = 0.8 + Math.random() * 4.2        // 0.8–5.0 px (mix thin + bold)
    triggerRipple(x, y, color, speed, lineWidth, vx, 0)
  }
}

// ── Component-local interfaces ────────────────────────────────────────────────
interface NotePos {
  note: MeasureNote
  nx: number
  ny: number
  alpha: number
  stemTipY?: number
}

// ── Toneless click (white noise burst) ───────────────────────────────────────
function playClick() {
  try {
    const ctx = new AudioContext()
    const bufLen = Math.ceil(ctx.sampleRate * 0.04)
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data   = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1
    const src  = ctx.createBufferSource()
    src.buffer = buf
    const hp   = ctx.createBiquadFilter()
    hp.type    = 'highpass'
    hp.frequency.value = 800
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
    src.connect(hp)
    hp.connect(gain)
    gain.connect(ctx.destination)
    src.start()
    src.onended = () => void ctx.close()
  } catch { /* audio unavailable */ }
}

// ── Note drawing ──────────────────────────────────────────────────────────────
function staffY(yPos: number, staffCy: number) {
  return staffCy + (yPos - 4) * (LINE_GAP / 2)
}

function drawNote(
  ctx: CanvasRenderingContext2D,
  nx: number, ny: number,
  type: NoteType, yPos: number,
  alpha: number,
  skipFlag = false,
  stemUpOverride?: boolean,
  stemTipY?: number,
) {
  if (alpha <= 0.01) return
  ctx.save()
  ctx.globalAlpha = alpha

  const filled = type !== 'h' && type !== 'w'
  const stemUp = stemUpOverride !== undefined ? stemUpOverride : yPos < 4

  // Note head
  ctx.beginPath()
  if (type === 'w') {
    ctx.ellipse(nx, ny, 8.75, 6, -0.18, 0, Math.PI * 2)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.stroke()
  } else {
    ctx.ellipse(nx, ny, 7, 5, -0.28, 0, Math.PI * 2)
    if (filled) {
      ctx.fillStyle = '#000000'
      ctx.fill()
    } else {
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  // Augmentation dot (dotted quarter)
  if (type === 'dq') {
    ctx.beginPath()
    ctx.fillStyle = '#000000'
    ctx.arc(nx + 12.5, ny - 2.5, 2.75, 0, Math.PI * 2)
    ctx.fill()
  }

  // Stem (all but whole)
  if (type !== 'w') {
    const sx  = nx + (stemUp ? 7 : -7)
    const sy0 = ny + (stemUp ? -4.4 : 4.4)
    const sy1 = stemTipY !== undefined ? stemTipY : ny + (stemUp ? -40 : 40)
    ctx.beginPath()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth   = 1.5
    ctx.moveTo(sx, sy0)
    ctx.lineTo(sx, sy1)
    ctx.stroke()

    // Flag(s) for eighth and sixteenth notes (solo — not beamed)
    if ((type === 'e' || type === 's') && !skipFlag) {
      const drawFlag = (yStart: number) => {
        ctx.beginPath()
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1.6
        if (stemUp) {
          ctx.moveTo(sx, yStart)
          ctx.bezierCurveTo(sx + 17.5, yStart + 7.5, sx + 15, yStart + 21, sx + 3.75, yStart + 31)
        } else {
          ctx.moveTo(sx, yStart)
          ctx.bezierCurveTo(sx + 17.5, yStart - 7.5, sx + 15, yStart - 21, sx + 3.75, yStart - 31)
        }
        ctx.stroke()
      }
      drawFlag(sy1)
      if (type === 's') drawFlag(sy1 + (stemUp ? 8 : -8))
    }
  }

  ctx.restore()
}

// ── Rest symbol ───────────────────────────────────────────────────────────────
// Draws a simplified quarter-rest (Z-shaped zigzag) centred on (nx, ny).
function drawRest(ctx: CanvasRenderingContext2D, nx: number, ny: number, alpha: number) {
  if (alpha <= 0.01) return
  ctx.save()
  ctx.globalAlpha = alpha * 0.8
  ctx.strokeStyle = '#000000'
  ctx.lineWidth   = 1.8
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  ctx.beginPath()
  ctx.moveTo(nx + 5, ny - 9)   // top-right
  ctx.lineTo(nx - 5, ny - 9)   // top-left  (top bar)
  ctx.lineTo(nx + 5, ny + 9)   // bottom-right (diagonal)
  ctx.lineTo(nx - 5, ny + 9)   // bottom-left  (bottom bar)
  ctx.stroke()
  ctx.restore()
}


// ── Component ─────────────────────────────────────────────────────────────────
interface MusicNoteCanvasProps {
  onNoteCross?: () => void
  onBeatLabel?: (label: string) => void
}

export function MusicNoteCanvas({ onNoteCross, onBeatLabel }: MusicNoteCanvasProps) {
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const rafRef        = useRef<number>(0)
  const onCrossRef    = useRef(onNoteCross)
  const onBeatLblRef  = useRef(onBeatLabel)

  useEffect(() => { onCrossRef.current = onNoteCross }, [onNoteCross])
  useEffect(() => { onBeatLblRef.current = onBeatLabel }, [onBeatLabel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      if (!canvas) return
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const measures = makeMeasures()
    const { mWidths, cumWidths, mSpeeds, totalContent } = buildScrollData(measures)

    // Pre-mark notes already left of the centre line at a given scrollX so they
    // don't re-fire audio/ripples on the first frame, and return the correct mi_active.
    function applyInitialScroll(sx: number, cw: number): number {
      const co = sx - cw / 2
      for (let i = 0; i < NUM_MEASURES; i++) {
        const pad = NOTE_MARGIN
        const mw  = mWidths[i]
        for (const note of measures[i]) {
          if (cumWidths[i] + pad + (note.beat / 4) * mw <= co) note.triggered = true
        }
      }
      let mia = 0
      while (mia < NUM_MEASURES - 1 && cumWidths[mia + 1] + NOTE_MARGIN <= co) mia++
      return mia
    }

    // Start with the canvas filled: barline 0 at the left edge (scrollX = canvas.width).
    let scrollX   = canvas.width
    let mi_active = applyInitialScroll(scrollX, canvas.width)

    function draw() {
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const W       = canvas.width
      const H       = canvas.height
      const cx      = W / 2
      const staffCy = H / 2

      ctx.clearRect(0, 0, W, H)
      scrollX += mSpeeds[mi_active]

      if (scrollX > totalContent + W) {
        scrollX = W
        for (const m of measures) for (const n of m) n.triggered = false
        mi_active = applyInitialScroll(W, W)
      }

      // Advance mi_active when beat 0 of the next measure crosses the centre line
      // (not when the barline does). This ensures the NOTE_MARGIN gap between the
      // barline and beat 0 is traversed at the current measure's speed, keeping
      // the inter-measure beat interval identical to within-measure intervals.
      const centerOffset = scrollX - W / 2
      while (mi_active < NUM_MEASURES - 1 && cumWidths[mi_active + 1] + NOTE_MARGIN <= centerOffset) mi_active++

      // Staff lines
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'
      ctx.lineWidth   = 1
      for (let l = 0; l < 5; l++) {
        const y = staffCy - 2 * LINE_GAP + l * LINE_GAP
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }

      const rect = canvas.getBoundingClientRect()

      for (let mi = 0; mi < NUM_MEASURES; mi++) {
        const mw   = mWidths[mi]
        const barX = W + cumWidths[mi] - scrollX
        if (barX > W + mw) continue
        if (barX + mw < -mw) continue

        const staffTop = staffCy - 2 * LINE_GAP
        const staffBot = staffCy + 2 * LINE_GAP

        // Barline
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'
        ctx.lineWidth   = 1.4
        ctx.beginPath()
        ctx.moveTo(barX, staffTop)
        ctx.lineTo(barX, staffBot)
        ctx.stroke()

        const isFirst = mi === 0
        // All measures use NOTE_MARGIN so beat spacing is uniform across barlines.
        const pad = NOTE_MARGIN

        const edgeFade = (x: number) =>
          x < 80 ? Math.max(0, x / 80) : x > W - 60 ? Math.max(0, (W - x) / 60) : 1

        // Percussion clef + time signature on measure 0 only
        if (isFirst) {
          const symAlpha = edgeFade(barX) * 0.7
          if (symAlpha > 0.02) {
            ctx.save()
            ctx.globalAlpha = symAlpha
            ctx.fillStyle   = '#000000'

            // Percussion (neutral) clef — two thin vertical bars (compact to stay left of the beat-0 note)
            ctx.fillRect(barX + 1,   staffTop, 2.5, staffBot - staffTop)
            ctx.fillRect(barX + 4.5, staffTop, 2.5, staffBot - staffTop)

            // 4/4 time signature — small enough to clear the beat-0 note at barX+16
            ctx.font         = 'bold 12px serif'
            ctx.textBaseline = 'middle'
            ctx.fillText('4', barX + 8, staffCy - LINE_GAP + 1)
            ctx.fillText('4', barX + 8, staffCy + LINE_GAP - 1)

            ctx.restore()
          }
        }

        // ── Phase 1: collect note positions + trigger ──
        const notePosArr: NotePos[] = []
        for (const note of measures[mi]) {
          const nx    = barX + pad + (note.beat / 4) * mw
          const ny    = staffY(note.yPos, staffCy)
          const alpha = edgeFade(nx)

          if (!note.triggered && nx <= cx) {
            note.triggered = true
            triggerRippleBurst(rect.left + cx, rect.top + ny, -mSpeeds[mi_active])
            onBeatLblRef.current?.(getBeatLabel(note.beat))
            playClick()
            onCrossRef.current?.()
          }

          notePosArr.push({ note, nx, ny, alpha })
        }

        // ── Phase 2: identify beam groups ──
        const beamGroups: Array<{ notes: NotePos[]; stemUp: boolean; noteType: NoteType }> = []
        const beamedMap = new Map<NotePos, boolean>()

        let i = 0
        while (i < notePosArr.length) {
          const pos = notePosArr[i]
          if (pos.note.type === 'e' || pos.note.type === 's') {
            const noteType = pos.note.type
            const interval = noteType === 'e' ? 0.5 : 0.25
            const group: NotePos[] = [pos]
            let j = i + 1
            while (
              j < notePosArr.length &&
              notePosArr[j].note.type === noteType &&
              Math.abs(notePosArr[j].note.beat - notePosArr[j - 1].note.beat - interval) < 0.01
            ) {
              group.push(notePosArr[j])
              j++
            }
            if (group.length >= 2) {
              const stemUpCount = group.filter((n) => n.note.yPos < 4).length
              const stemUp = stemUpCount >= group.length / 2
              beamGroups.push({ notes: group, stemUp, noteType })
              for (const n of group) beamedMap.set(n, stemUp)
            }
            i = j
          } else {
            i++
          }
        }

        // Compute exact stem tip y for each beamed note so stems meet the beam.
        // If any note's stem would be too short (beam too close to note head), shift
        // the entire beam (preserving slope) until all stems meet the minimum safe
        // distance. MIN_SAFE is from note centre; 20px clears the second 16th beam
        // (offset 9px) plus the beam lineWidth (4.4px) plus a small gap.
        const MIN_SAFE = 20
        for (const { notes, stemUp } of beamGroups) {
          const sy = stemUp ? -40 : 40
          const f  = notes[0], l = notes[notes.length - 1]
          let by1 = f.ny + sy, by2 = l.ny + sy
          const dx = l.nx - f.nx
          if (dx > 0) {
            let shift = 0
            for (const pos of notes) {
              const beamAtX = by1 + (by2 - by1) * (pos.nx - f.nx) / dx
              const gap = stemUp
                ? (pos.ny - MIN_SAFE) - beamAtX
                : beamAtX - (pos.ny + MIN_SAFE)
              if (gap < 0) shift = Math.max(shift, -gap)
            }
            if (stemUp) { by1 -= shift; by2 -= shift }
            else        { by1 += shift; by2 += shift }
          }
          for (const pos of notes) {
            pos.stemTipY = dx > 0 ? by1 + (by2 - by1) * (pos.nx - f.nx) / dx : by1
          }
        }

        // ── Phase 3: draw notes (+ rest if beat 0 is uncovered) ──
        // Guard: every measure should have something on beat 0. If none of the
        // notes land there, draw a quarter-rest symbol so the downbeat is never
        // visually empty. (All current PATTERNS include beat 0; this is a safeguard.)
        const hasBeat0 = notePosArr.some(p => Math.abs(p.note.beat) < 0.01)
        if (!hasBeat0) {
          const nx0 = barX + pad
          drawRest(ctx, nx0, staffCy, edgeFade(nx0))
        }

        for (const pos of notePosArr) {
          const stemUpOverride = beamedMap.get(pos)
          drawNote(
            ctx, pos.nx, pos.ny,
            pos.note.type, pos.note.yPos, pos.alpha,
            beamedMap.has(pos), stemUpOverride, pos.stemTipY,
          )
        }

        // ── Phase 4: draw beams ──
        for (const { notes, stemUp, noteType } of beamGroups) {
          const first = notes[0]
          const last  = notes[notes.length - 1]
          const sx    = stemUp ? 7 : -7
          const avgAlpha = notes.reduce((s, n) => s + n.alpha, 0) / notes.length

          ctx.save()
          ctx.globalAlpha = avgAlpha
          ctx.strokeStyle = '#000000'
          ctx.lineWidth   = 4.4
          ctx.lineCap     = 'butt'

          const drawBeam = (offset: number) => {
            ctx.beginPath()
            ctx.moveTo(first.nx + sx, (first.stemTipY ?? first.ny + (stemUp ? -40 : 40)) + offset)
            ctx.lineTo(last.nx  + sx, (last.stemTipY  ?? last.ny  + (stemUp ? -40 : 40)) + offset)
            ctx.stroke()
          }

          drawBeam(0)
          if (noteType === 's') drawBeam(stemUp ? 9 : -9)

          ctx.restore()
        }
      }

      // Faint centre-line indicator
      ctx.strokeStyle = 'rgba(108,99,255,0.07)'
      ctx.lineWidth   = 1
      ctx.setLineDash([4, 7])
      ctx.beginPath()
      ctx.moveTo(cx, staffCy - 2 * LINE_GAP - 18)
      ctx.lineTo(cx, staffCy + 2 * LINE_GAP + 18)
      ctx.stroke()
      ctx.setLineDash([])

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="music-note-canvas" />
}
