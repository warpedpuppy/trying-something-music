type Ripple = {
  x: number; y: number; r: number; maxR: number; alpha: number
  color: string; active: boolean
  speed: number      // expansion speed multiplier (1 = default)
  lineWidth: number  // stroke thickness in px
  vx: number; vy: number  // screen velocity px/frame (follows the note)
}

const POOL_SIZE = 128
const pool: Ripple[] = Array.from({ length: POOL_SIZE }, () => ({
  x: 0, y: 0, r: 0, maxR: 0, alpha: 0,
  color: 'rgba(255,255,255,0.5)', active: false,
  speed: 1, lineWidth: 2.5, vx: 0, vy: 0,
}))

let canvas: HTMLCanvasElement | null = null
let rafId = 0

function resize() {
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function draw() {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (const r of pool) {
    if (!r.active) continue
    r.x += r.vx
    r.y += r.vy
    r.r += (4 + r.r * 0.016) * 0.85 * r.speed
    r.alpha = 0.18 * (1 - r.r / r.maxR)
    if (r.r >= r.maxR || r.alpha <= 0) {
      r.active = false
      continue
    }
    ctx.beginPath()
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
    ctx.strokeStyle = r.color
    ctx.lineWidth = r.lineWidth
    ctx.globalAlpha = Math.max(0, r.alpha)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  rafId = requestAnimationFrame(draw)
}

export function initRippleCanvas(c: HTMLCanvasElement) {
  canvas = c
  resize()
  window.addEventListener('resize', resize)
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(draw)
}

export function cleanupRippleCanvas() {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
  canvas = null
}

export function clearRipples() {
  for (const r of pool) r.active = false
}

export function triggerRipple(
  x: number, y: number,
  color = 'rgba(255,255,255,0.55)',
  speed = 1,
  lineWidth = 2.5,
  vx = 0,
  vy = 0,
) {
  if (!canvas) return
  const maxR = Math.hypot(Math.max(x, canvas.width - x), Math.max(y, canvas.height - y)) * 1.1
  const slot = pool.find((r) => !r.active)
  if (!slot) return
  slot.x = x; slot.y = y; slot.r = 12; slot.maxR = maxR
  slot.alpha = 0.18; slot.color = color; slot.active = true
  slot.speed = speed; slot.lineWidth = lineWidth
  slot.vx = vx; slot.vy = vy
}
