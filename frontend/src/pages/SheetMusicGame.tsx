import { useCallback, useEffect, useRef, useState } from 'react'
import { tickEngine } from '../lib/audio'
import { triggerRipple } from '../lib/rippleEngine'
import { PIECES, type NoteType, type SheetNote, type SheetPiece } from '../lib/sheetMusicData'

// ── Canvas constants (match home animation scale) ─────────────────────────────
const MEASURE_W        = 216
const LINE_GAP         = 12
const NOTE_MARGIN_FIRST = 40
const NOTE_MARGIN      = 8
const LOOKAHEAD_BEATS  = 4   // beats ahead of center notes first appear
const MAX_REDS         = 10

type NoteState = 'pending' | 'green' | 'red'
type GamePhase = 'idle' | 'playing' | 'gameover' | 'complete'

const NOTE_COLORS: Record<NoteState, string> = {
  pending: '#1a1a1a',
  green:   '#16a34a',
  red:     '#dc2626',
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function noteAbsX(note: SheetNote, timeSigTop: number): number {
  const margin = note.measure === 0 ? NOTE_MARGIN_FIRST : NOTE_MARGIN
  const area   = MEASURE_W - margin
  return note.measure * MEASURE_W + margin + (note.beat / timeSigTop) * area
}

function staffY(yPos: number, staffCy: number): number {
  return staffCy + (yPos - 4) * (LINE_GAP / 2)
}

function pxPerFrame(bpm: number, timeSigTop: number): number {
  return (MEASURE_W * bpm) / (timeSigTop * 3600)
}

function edgeFade(nx: number, W: number): number {
  if (nx < 60) return Math.max(0, nx / 60)
  if (nx > W - 60) return Math.max(0, (W - nx) / 60)
  return 1
}

// ── Note drawing (game version — accepts explicit color) ──────────────────────

function drawNote(
  ctx: CanvasRenderingContext2D,
  nx: number, ny: number,
  type: NoteType, yPos: number,
  alpha: number, color: string,
) {
  if (alpha <= 0.01) return
  ctx.save()
  ctx.globalAlpha = alpha

  const filled = type !== 'h' && type !== 'w'
  const stemUp = yPos < 4
  const stemX  = nx + (stemUp ? 7 : -7)

  // Note head
  ctx.beginPath()
  if (type === 'w') {
    ctx.ellipse(nx, ny, 8.75, 6, -0.18, 0, Math.PI * 2)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
  } else {
    ctx.ellipse(nx, ny, 7, 5, -0.28, 0, Math.PI * 2)
    if (filled) {
      ctx.fillStyle = color
      ctx.fill()
    } else {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  // Augmentation dot
  if (type === 'dq') {
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(nx + 12.5, ny - 2.5, 2.75, 0, Math.PI * 2)
    ctx.fill()
  }

  // Stem + flag (all but whole)
  if (type !== 'w') {
    const sy0 = ny + (stemUp ? -4.4 : 4.4)
    const sy1 = ny + (stemUp ? -40 : 40)
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.moveTo(stemX, sy0)
    ctx.lineTo(stemX, sy1)
    ctx.stroke()

    if (type === 'e') {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.6
      if (stemUp) {
        ctx.moveTo(stemX, sy1)
        ctx.bezierCurveTo(stemX + 17.5, sy1 + 7.5, stemX + 15, sy1 + 21, stemX + 3.75, sy1 + 31)
      } else {
        ctx.moveTo(stemX, sy1)
        ctx.bezierCurveTo(stemX + 17.5, sy1 - 7.5, stemX + 15, sy1 - 21, stemX + 3.75, sy1 - 31)
      }
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SheetMusicGame() {
  const [pieceIdx, setPieceIdx]   = useState(0)
  const [bpm, setBpm]             = useState(PIECES[0].defaultBpm)
  const [phase, setPhase]         = useState<GamePhase>('idle')
  const [redCount, setRedCount]   = useState(0)
  const [greenCount, setGreenCount] = useState(0)

  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const rafRef         = useRef(0)
  const scrollXRef     = useRef(0)
  const bpmRef         = useRef(bpm)
  const phaseRef       = useRef<GamePhase>('idle')
  const noteStatesRef  = useRef<NoteState[]>([])
  const redCountRef    = useRef(0)
  const greenCountRef  = useRef(0)
  const pieceIdxRef    = useRef(0)
  const tapBtnRef      = useRef<HTMLButtonElement>(null)

  useEffect(() => { bpmRef.current = bpm }, [bpm])

  // ── Canvas sizing ────────────────────────────────────────────────────────────
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
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function computeStartScrollX(piece: SheetPiece, W: number): number {
    const cx     = W / 2
    const pixBeat = MEASURE_W / piece.timeSigTop
    return cx + noteAbsX(piece.notes[0], piece.timeSigTop) - LOOKAHEAD_BEATS * pixBeat
  }

  function resetState(idx: number) {
    const piece = PIECES[idx]
    noteStatesRef.current  = new Array(piece.notes.length).fill('pending')
    redCountRef.current    = 0
    greenCountRef.current  = 0
    setRedCount(0)
    setGreenCount(0)
    const canvas = canvasRef.current
    if (canvas) scrollXRef.current = computeStartScrollX(piece, canvas.width || 1080)
  }

  // ── Tap judgment ─────────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    tickEngine.tick('tap')

    const piece   = PIECES[pieceIdxRef.current]
    const canvas  = canvasRef.current
    if (!canvas) return

    const cx          = canvas.width / 2
    const pixBeat     = MEASURE_W / piece.timeSigTop
    const tolerancePx = pixBeat * 0.4
    const sx          = scrollXRef.current

    let bestIdx = -1
    let bestDist = Infinity
    for (let i = 0; i < piece.notes.length; i++) {
      if (noteStatesRef.current[i] !== 'pending') continue
      const hitSX = cx + noteAbsX(piece.notes[i], piece.timeSigTop)
      const dist  = Math.abs(sx - hitSX)
      if (dist < tolerancePx && dist < bestDist) {
        bestDist = dist
        bestIdx  = i
      }
    }

    if (bestIdx >= 0) {
      noteStatesRef.current[bestIdx] = 'green'
      greenCountRef.current++
      setGreenCount(greenCountRef.current)
      const btn = tapBtnRef.current
      if (btn) {
        const r = btn.getBoundingClientRect()
        triggerRipple(r.left + r.width / 2, r.top + r.height / 2, 'rgba(22,163,74,0.35)')
      }
    }
  }, [])

  // ── Spacebar ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' && !e.repeat) { e.preventDefault(); handleTap() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleTap])

  // ── Metronome sync on BPM change ─────────────────────────────────────────────
  useEffect(() => {
    if (phaseRef.current === 'playing') {
      tickEngine.stopMetronome()
      tickEngine.startMetronome(bpm)
    }
  }, [bpm])

  // ── Game loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    let alive = true

    function loop() {
      if (!alive) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const piece    = PIECES[pieceIdxRef.current]
      const speed    = pxPerFrame(bpmRef.current, piece.timeSigTop)
      scrollXRef.current += speed

      const W       = canvas.width
      const H       = canvas.height
      const cx      = W / 2
      const staffCy = H / 2
      const pixBeat     = MEASURE_W / piece.timeSigTop
      const tolerancePx = pixBeat * 0.4

      // ── Judge misses ──
      let hadRed = false
      for (let i = 0; i < piece.notes.length; i++) {
        if (noteStatesRef.current[i] !== 'pending') continue
        const hitSX = cx + noteAbsX(piece.notes[i], piece.timeSigTop)
        if (scrollXRef.current > hitSX + tolerancePx) {
          noteStatesRef.current[i] = 'red'
          redCountRef.current++
          hadRed = true
        }
      }
      if (hadRed) setRedCount(redCountRef.current)

      // ── Draw ──────────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H)

      // Staff lines
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'
      ctx.lineWidth = 1
      for (let l = 0; l < 5; l++) {
        const y = staffCy - 2 * LINE_GAP + l * LINE_GAP
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // Barlines + time signature
      const totalMeasures = (piece.notes[piece.notes.length - 1]?.measure ?? 0) + 2
      for (let mi = 0; mi < totalMeasures; mi++) {
        const barX = W + mi * MEASURE_W - scrollXRef.current
        if (barX > W + MEASURE_W || barX + MEASURE_W < -MEASURE_W) continue

        ctx.strokeStyle = 'rgba(0,0,0,0.20)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(barX, staffCy - 2 * LINE_GAP)
        ctx.lineTo(barX, staffCy + 2 * LINE_GAP)
        ctx.stroke()

        if (mi === 0) {
          const tsAlpha = edgeFade(barX, W) * 0.7
          if (tsAlpha > 0.02) {
            ctx.save()
            ctx.globalAlpha = tsAlpha
            ctx.fillStyle = '#000'
            ctx.font = 'bold 21px serif'
            ctx.textBaseline = 'middle'
            ctx.fillText(String(piece.timeSigTop),    barX + 6, staffCy - LINE_GAP + 1)
            ctx.fillText(String(piece.timeSigBottom),  barX + 6, staffCy + LINE_GAP - 1)
            ctx.restore()
          }
        }
      }

      // Notes
      for (let i = 0; i < piece.notes.length; i++) {
        const note  = piece.notes[i]
        const barX  = W + note.measure * MEASURE_W - scrollXRef.current
        const margin = note.measure === 0 ? NOTE_MARGIN_FIRST : NOTE_MARGIN
        const area   = MEASURE_W - margin
        const nx    = barX + margin + (note.beat / piece.timeSigTop) * area
        const ny    = staffY(note.yPos, staffCy)
        const alpha = edgeFade(nx, W)
        const color = NOTE_COLORS[noteStatesRef.current[i]]
        drawNote(ctx, nx, ny, note.type, note.yPos, alpha, color)
      }

      // Hit line
      ctx.strokeStyle = 'rgba(108,99,255,0.18)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.moveTo(cx, staffCy - 2 * LINE_GAP - 20)
      ctx.lineTo(cx, staffCy + 2 * LINE_GAP + 20)
      ctx.stroke()
      ctx.setLineDash([])

      // ── End-of-game checks (after drawing) ───────────────────────────────────
      if (redCountRef.current >= MAX_REDS) {
        alive = false
        tickEngine.stopMetronome()
        phaseRef.current = 'gameover'
        setPhase('gameover')
        return
      }

      const allJudged = noteStatesRef.current.every(s => s !== 'pending')
      if (allJudged) {
        alive = false
        tickEngine.stopMetronome()
        phaseRef.current = 'complete'
        setPhase('complete')
        return
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [phase])

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      tickEngine.stopMetronome()
    }
  }, [])

  // ── Event handlers ───────────────────────────────────────────────────────────
  function startGame() {
    cancelAnimationFrame(rafRef.current)
    tickEngine.stopMetronome()
    resetState(pieceIdxRef.current)
    phaseRef.current = 'playing'
    setPhase('playing')
    tickEngine.startMetronome(bpmRef.current)
  }

  function handlePieceChange(idx: number) {
    cancelAnimationFrame(rafRef.current)
    tickEngine.stopMetronome()
    setPieceIdx(idx)
    pieceIdxRef.current = idx
    const defaultBpm = PIECES[idx].defaultBpm
    setBpm(defaultBpm)
    bpmRef.current = defaultBpm
    phaseRef.current = 'idle'
    setPhase('idle')
    resetState(idx)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const piece = PIECES[pieceIdx]

  return (
    <div className="game-page">

      {/* ── Piece selector ── */}
      <div className="game-piece-select">
        {PIECES.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={`game-piece-btn${pieceIdx === i ? ' active' : ''}`}
            onClick={() => handlePieceChange(i)}
          >
            <span className="game-piece-title">{p.title}</span>
            <span className="game-piece-composer">{p.composer}</span>
          </button>
        ))}
      </div>

      {/* ── BPM control ── */}
      <div className="game-bpm-row">
        <span className="game-bpm-label">Tempo</span>
        <input
          type="range"
          className="game-bpm-slider"
          min={40} max={200} step={1}
          value={bpm}
          onChange={e => setBpm(Number(e.target.value))}
        />
        <span className="game-bpm-value">{bpm} BPM</span>
      </div>

      {/* ── Canvas ── */}
      <div className="game-canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" />

        {phase !== 'playing' && (
          <div className="game-overlay">
            {phase === 'gameover' && (
              <>
                <p className="game-overlay-title">Too many misses</p>
                <p className="game-overlay-sub">{greenCount} / {piece.notes.length} notes hit</p>
              </>
            )}
            {phase === 'complete' && (
              <>
                <p className="game-overlay-title">Complete!</p>
                <p className="game-overlay-sub">{greenCount} / {piece.notes.length} notes hit</p>
              </>
            )}
            {phase === 'idle' && (
              <p className="game-overlay-sub">{piece.title}</p>
            )}
            <button type="button" className="game-start-btn" onClick={startGame}>
              {phase === 'gameover' ? 'Try Again' : phase === 'complete' ? 'Play Again' : 'Start'}
            </button>
          </div>
        )}
      </div>

      {/* ── Miss meter ── */}
      <div className="game-status-row">
        <span className="game-miss-label">Misses</span>
        <div className="game-miss-dots">
          {Array.from({ length: MAX_REDS }, (_, i) => (
            <span key={i} className={`game-miss-dot${i < redCount ? ' filled' : ''}`} />
          ))}
        </div>
        {phase === 'playing' && (
          <span className="game-score-live">{greenCount} hit</span>
        )}
      </div>

      {/* ── TAP button ── */}
      <div className="game-tap-wrap">
        <button
          ref={tapBtnRef}
          type="button"
          className="game-tap-btn"
          onPointerDown={e => { e.preventDefault(); handleTap() }}
          disabled={phase !== 'playing'}
        >
          TAP
        </button>
        <span className="game-tap-hint">or press Space</span>
      </div>

    </div>
  )
}
