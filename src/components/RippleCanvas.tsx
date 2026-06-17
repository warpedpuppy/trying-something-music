import { useEffect, useRef } from 'react'
import { initRippleCanvas, cleanupRippleCanvas } from '../lib/rippleEngine'

export function RippleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    initRippleCanvas(canvas)
    return () => cleanupRippleCanvas()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
