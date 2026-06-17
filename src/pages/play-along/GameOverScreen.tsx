import { useState } from 'react'
import { MistakeMeasureBlock } from './MistakeMeasureBlock'
import type { GeneratedMeasure } from '../../lib/rhythmGenerator'

export interface GameOverScreenProps {
  mistakenMeasures: GeneratedMeasure[]
  bpm: number
  onReviewMeasure: (m: GeneratedMeasure) => void
  onReturnToStart: () => void
}

export function GameOverScreen({ mistakenMeasures, onReviewMeasure, onReturnToStart }: GameOverScreenProps) {
  const [showList, setShowList] = useState(false)

  if (!showList) {
    return (
      <div className="pa-stage pa-gameover">
        <h1 className="pa-gameover-title">Too many misses!</h1>
        <p className="pa-gameover-body">
          {mistakenMeasures.length > 0
            ? 'Review the measures that tripped you up before trying again.'
            : 'No measures to review.'}
        </p>
        {mistakenMeasures.length > 0 && (
          <button type="button" className="btn-primary pa-cta" onClick={() => setShowList(true)}>
            Review mistaken measures
          </button>
        )}
        <button type="button" className="pa-stop-btn-pill" onClick={onReturnToStart}>
          Return to start page
        </button>
      </div>
    )
  }

  return (
    <div className="pa-gameover-review">
      <button type="button" className="btn-primary pa-cta" onClick={onReturnToStart}>
        Return to start page
      </button>
      <p className="pa-mistakes-header">Click each measure to see its rhythm</p>
      <div className="pa-mistakes-list">
        {mistakenMeasures.map((measure, i) => (
          <div
            key={i}
            className="pa-mistake-card"
            role="button"
            tabIndex={0}
            onClick={() => onReviewMeasure(measure)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onReviewMeasure(measure) }}
            aria-label={`Hear measure: ${measure.label}`}
          >
            <MistakeMeasureBlock measure={measure} />
          </div>
        ))}
      </div>
      <button type="button" className="btn-primary pa-cta" onClick={onReturnToStart}>
        Return to start page
      </button>
    </div>
  )
}
