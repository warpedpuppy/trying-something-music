type Ripple = {
  x: number; y: number; r: number; maxR: number; alpha: number; maxAlpha: number
  color: string; active: boolean
  speed: number      // expansion speed multiplier (1 = default)
  lineWidth: number  // stroke thickness in px
  vx: number; vy: number  // screen velocity px/frame (follows the note)
}

const POOL_SIZE = 128
const pool: Ripple[] = Array.from({ length: POOL_SIZE }, () => ({
  x: 0, y: 0, r: 0, maxR: 0, alpha: 0, maxAlpha: 0.18,
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
    r.alpha = r.maxAlpha * (1 - r.r / r.maxR)
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
  maxAlpha = 0.18,
  customMaxR?: number,
) {
  if (!canvas) return
  const maxR = customMaxR ?? Math.hypot(Math.max(x, canvas.width - x), Math.max(y, canvas.height - y)) * 1.1
  const slot = pool.find((r) => !r.active)
  if (!slot) return
  slot.x = x; slot.y = y; slot.r = 12; slot.maxR = maxR
  slot.alpha = maxAlpha; slot.maxAlpha = maxAlpha; slot.color = color; slot.active = true
  slot.speed = speed; slot.lineWidth = lineWidth
  slot.vx = vx; slot.vy = vy
}

/**
 * Fires N staggered concentric rainbow ripples from (x, y).
 * Used by the Play Along TAP button.
 *   • count  — random 5–10 rings
 *   • alpha  — random 10–35 % opacity
 *   • hues   — evenly spaced around the colour wheel from a random starting hue
 */
export function triggerRainbowBurst(x: number, y: number) {
  const count    = Math.floor(Math.random() * 6) + 5          // 5–10
  const alpha    = Math.random() * 0.25 + 0.10                // 0.10–0.35
  const baseHue  = Math.random() * 360
  const step     = 360 / count
  for (let i = 0; i < count; i++) {
    const hue   = (baseHue + step * i) % 360
    const color = `hsl(${Math.round(hue)}, 100%, 55%)`
    window.setTimeout(() => triggerRipple(x, y, color, 1, 2, 0, 0, alpha), i * 55)
  }
}
