import { memo, useEffect, useRef, useState, type MouseEvent } from 'react'
import { renderPattern } from '../../lib/vexflowPattern'
import { SLOT_PX } from '../../lib/playAlongTiming'
import type { GeneratedMeasure } from '../../lib/rhythmGenerator'

interface NotationBlockProps {
  measure: GeneratedMeasure
  onClick: (event?: MouseEvent<HTMLDivElement>) => void
  hitNoteIndices?: number[]
  missNoteIndices?: number[]
  strayXs?: number[]
  pulseNonce?: number
}

export const NotationBlock = memo(function NotationBlock({
  measure,
  onClick,
  hitNoteIndices,
  missNoteIndices,
  strayXs,
  pulseNonce = 0,
}: NotationBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const anchorsRef   = useRef<Map<number, number>>(new Map())
  const [downbeatNoteX, setDownbeatNoteX] = useState<number | null>(null)
  const [renderError, setRenderError] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let statusTimer: number | null = null
    const setRenderErrorDeferred = (value: boolean) => {
      statusTimer = window.setTimeout(() => setRenderError(value), 0)
    }
    try {
      const result = renderPattern(
        el,
        { events: measure.events },
        measure.timeSigTop,
        measure.timeSigBottom,
        { fixedTotalWidth: SLOT_PX, showClef: measure.showClef, showTimeSignature: measure.showTimeSig, seamless: true },
      )
      const map = new Map<number, number>()
      result.anchors.forEach(a => map.set(a.eventIndex, a.x))
      anchorsRef.current = map

      if (result.firstEventX !== undefined) setDownbeatNoteX(result.firstEventX)
      setRenderErrorDeferred(false)
    } catch (err) {
      console.warn('NotationBlock render failed', err)
      setRenderErrorDeferred(true)
    }
    return () => {
      if (statusTimer !== null) window.clearTimeout(statusTimer)
    }
  }, [measure])

  const levelDots = '●'.repeat(measure.level) + '○'.repeat(5 - measure.level)

  return (
    <div
      className="pa-measure-block"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-label={`Hear measure: ${measure.label}`}
    >
      <div className="pa-notation-wrapper">
        {downbeatNoteX !== null && (
          <div
            key={pulseNonce}
            className={`pa-beat1-arrow${hitNoteIndices?.includes(0) ? ' hit' : ''}${pulseNonce > 0 ? ' pulsing' : ''}`}
            aria-hidden="true"
            style={{ left: downbeatNoteX }}
          >▼</div>
        )}
        {renderError && <p className="error-text">Notation unavailable</p>}
        <div ref={containerRef} className="pa-notation-container" />

        {hitNoteIndices && hitNoteIndices.length > 0 && (
          <div className="pa-dots-layer" aria-hidden="true">
            {hitNoteIndices.filter(idx => idx !== 0).map(idx => {
              const x = anchorsRef.current.get(idx)
              return x !== undefined
                ? <div key={`h${idx}`} className="pa-hit-dot" style={{ left: x }} />
                : null
            })}
          </div>
        )}

        {missNoteIndices && missNoteIndices.length > 0 && (
          <div className="pa-dots-layer" aria-hidden="true">
            {missNoteIndices.map(idx => {
              const x = anchorsRef.current.get(idx)
              return x !== undefined
                ? <div key={`m${idx}`} className="pa-miss-dot" style={{ left: x }} />
                : null
            })}
          </div>
        )}

        {strayXs && strayXs.length > 0 && (
          <div className="pa-dots-layer" aria-hidden="true">
            {strayXs.map((x, i) => {
              // strayTapX returns a raw time-fraction × SLOT_PX position (0 = measure start).
              // VexFlow renders the first note at downbeatNoteX > 0, so we remap the
              // range [0, SLOT_PX] → [downbeatNoteX, SLOT_PX] so Xs are never left of
              // the first note.
              const left = downbeatNoteX !== null
                ? downbeatNoteX + (x / SLOT_PX) * (SLOT_PX - downbeatNoteX)
                : x
              return <div key={`s${i}`} className="pa-stray-x" style={{ left }}>×</div>
            })}
          </div>
        )}
      </div>

      <span className="pa-measure-hint">click to pause &amp; analyze</span>
      <div className="pa-measure-footer">
        <span className="pa-measure-label">{measure.label}</span>
        <span className="pa-measure-level" aria-label={`Level ${measure.level}`}>{levelDots}</span>
      </div>
    </div>
  )
})
