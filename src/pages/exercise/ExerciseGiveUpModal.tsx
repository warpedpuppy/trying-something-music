import { RhythmPlayback } from '../../components/RhythmPlayback'
import type { Exercise } from '../../api/types'

interface ExerciseGiveUpModalProps {
  exercise: Exercise
  open: boolean
  onClose: () => void
}

export function ExerciseGiveUpModal({ exercise, open, onClose }: ExerciseGiveUpModalProps) {
  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">Hear the rhythm</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <RhythmPlayback
          pattern={exercise.pattern}
          timeSigTop={exercise.time_sig_top}
          timeSigBottom={exercise.time_sig_bottom}
          bpm={exercise.tempo_bpm}
        />
      </div>
    </div>
  )
}
