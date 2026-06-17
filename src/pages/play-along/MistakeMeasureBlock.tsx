import { memo, useEffect, useRef } from 'react'
import { renderPattern } from '../../lib/vexflowPattern'
import { REVIEW_SLOT_PX } from './constants'
import type { GeneratedMeasure } from '../../lib/rhythmGenerator'

export const MistakeMeasureBlock = memo(function MistakeMeasureBlock({ measure }: { measure: GeneratedMeasure }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try {
      renderPattern(
        el,
        { events: measure.events },
        measure.timeSigTop,
        measure.timeSigBottom,
        { fixedTotalWidth: REVIEW_SLOT_PX, showClef: true, showTimeSignature: true, seamless: false },
      )
    } catch {
      // ignore render errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const levelDots = '●'.repeat(measure.level) + '○'.repeat(5 - measure.level)

  return (
    <div className="pa-mistake-card-inner">
      <div ref={containerRef} className="pa-notation-container" />
      <div className="pa-measure-footer">
        <span className="pa-measure-label">{measure.label}</span>
        <span className="pa-measure-level" aria-label={`Level ${measure.level}`}>{levelDots}</span>
      </div>
      <span className="pa-measure-hint">click to hear</span>
    </div>
  )
})
