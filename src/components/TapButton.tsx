import { useRef } from 'react'
import { triggerRipple } from '../lib/rippleEngine'

interface TapButtonProps {
  label: string
  sublabel?: string
  onTap: () => void
  disabled?: boolean
  /** Width in px — should match the rendered staff width. */
  width?: number
}

const ARROWS_LEFT = ['>', '>', '>'] as const
const ARROWS_RIGHT = ['<', '<', '<'] as const

export function TapButton({ label, sublabel, onTap, disabled, width }: TapButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isStart = label === 'START'

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    if (disabled) return

    const btn = buttonRef.current
    if (btn) {
      btn.classList.remove('tap-btn-flash')
      void btn.offsetWidth
      btn.classList.add('tap-btn-flash')
      const rect = btn.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const color = isStart
        ? 'rgba(5, 150, 105, 0.5)'
        : 'rgba(67, 97, 238, 0.45)'
      triggerRipple(cx, cy, color)
    }

    onTap()
  }

  const btnClass = [
    'tap-btn',
    isStart ? 'tap-btn-green' : 'tap-btn-blue',
    disabled ? 'tap-btn-disabled' : '',
  ].filter(Boolean).join(' ')

  const style: React.CSSProperties = {}
  if (width) style.width = `${width}px`

  return (
    <div className="tap-button-area">
      <button
        ref={buttonRef}
        type="button"
        className={btnClass}
        style={style}
        onPointerDown={handlePointerDown}
        onAnimationEnd={() => buttonRef.current?.classList.remove('tap-btn-flash')}
        disabled={disabled}
        aria-label={sublabel ? `${label} — ${sublabel}` : label}
      >
        {isStart && (
          <span className="tap-btn-arrows tap-btn-arrows-left" aria-hidden>
            {ARROWS_LEFT.map((ch, i) => (
              <span key={i} className="tap-btn-arrow" style={{ '--i': i } as React.CSSProperties}>{ch}</span>
            ))}
          </span>
        )}

        <span className="tap-btn-inner">
          <span className="tap-btn-label">{label}</span>
          {sublabel && <span className="tap-btn-sublabel">{sublabel}</span>}
        </span>

        {isStart && (
          <span className="tap-btn-arrows tap-btn-arrows-right" aria-hidden>
            {ARROWS_RIGHT.map((ch, i) => (
              /* right side: outermost (index 2) fires first → --i reverses */
              <span key={i} className="tap-btn-arrow" style={{ '--i': 2 - i } as React.CSSProperties}>{ch}</span>
            ))}
          </span>
        )}
      </button>
    </div>
  )
}
