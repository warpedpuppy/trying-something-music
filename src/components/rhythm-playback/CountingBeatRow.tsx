import type { CountingBeat } from '../../lib/rhythm'

interface CountingBeatRowProps {
  countingBeats: CountingBeat[]
}

export function CountingBeatRow({ countingBeats }: CountingBeatRowProps) {
  return (
    <p className="playback-count-label">
      {countingBeats.length === 0
        ? <span className="rp-count-placeholder">counting will appear here</span>
        : countingBeats.map((beat, i) => (
            <span key={i} style={{ color: beat.hasNote ? '#f97316' : 'var(--muted)' }}>
              {i > 0 ? (beat.label === 'trip' || beat.label === 'let' ? '-' : ' ') : ''}{beat.label}
            </span>
          ))
      }
    </p>
  )
}
