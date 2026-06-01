import { useLayoutEffect, useRef, useState } from 'react'
import type { Pattern, Verdict } from '../api/types'
import { renderPattern } from '../lib/vexflowPattern'
import type { NoteAnchor } from '../lib/vexflowPattern'

export type { NoteAnchor }

export interface DotMarker {
  /** Index into `pattern.events` of the note this dot sits above. */
  eventIndex: number
  kind: Verdict | 'playing'
  label?: string
}

const DOT_COLORS: Record<DotMarker['kind'], string> = {
  on_time: '#2e9e5b',
  early: '#e0a73c',
  late: '#e0a73c',
  wrong: '#d9534f',
  missed: '#9aa0a6',
  playing: '#3b6fe0',
}

const DOT_SYMBOLS: Partial<Record<DotMarker['kind'], string>> = {
  early: '◂',
  late: '▸',
}

interface RhythmStaffProps {
  pattern: Pattern
  timeSigTop: number
  timeSigBottom: number
  dots?: DotMarker[]
  caption?: string
  /** Current playhead x position (px within the staff canvas). Null = hidden. */
  playheadX?: number | null
  /** Called after each render with the SVG width, all note anchors, and the x of
   *  the first event (note or rest) — i.e. the start-of-measure / downbeat x. */
  onRendered?: (width: number, anchors: NoteAnchor[], firstEventX?: number) => void
}

/** Engraved notation with optional colored feedback dots floating above the notes. */
export function RhythmStaff({
  pattern,
  timeSigTop,
  timeSigBottom,
  dots = [],
  caption,
  playheadX,
  onRendered,
}: RhythmStaffProps) {
  const figureRef    = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const onRenderedRef = useRef(onRendered)
  onRenderedRef.current = onRendered   // keep ref fresh without triggering re-renders

  const [anchors, setAnchors]       = useState<NoteAnchor[]>([])
  const [renderError, setRenderError] = useState<string | null>(null)

  // Render (or re-render) the staff, clamping to the figure's available width.
  const doRender = (availableWidth: number) => {
    const container = containerRef.current
    if (!container) return
    try {
      const result = renderPattern(container, pattern, timeSigTop, timeSigBottom, {
        maxWidth: availableWidth > 0 ? availableWidth : undefined,
      })
      setAnchors(result.anchors)
      onRenderedRef.current?.(result.width, result.anchors, result.firstEventX)
      setRenderError(null)
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Could not render notation')
    }
  }

  useLayoutEffect(() => {
    const figure = figureRef.current
    if (!figure) return

    // Initial render using the figure's current layout width.
    doRender(figure.offsetWidth)

    // Re-render whenever the figure is resized (e.g. window resize, modal open).
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? figure.offsetWidth
      doRender(w)
    })
    ro.observe(figure)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern, timeSigTop, timeSigBottom])
  // Note: onRendered deliberately omitted — it's kept fresh via ref above.

  if (renderError) {
    return <p className="error-text">Notation error: {renderError}</p>
  }

  return (
    <figure className="rhythm-staff" ref={figureRef as React.RefObject<HTMLElement>}>
      <div className="rhythm-staff-canvas">
        <div ref={containerRef} />
        {playheadX != null && (
          <div className="staff-playhead" style={{ left: playheadX }} />
        )}
        {dots.map((dot, i) => {
          const anchor = anchors.find((a) => a.eventIndex === dot.eventIndex)
          if (!anchor) return null
          return (
            <span
              key={`${dot.eventIndex}-${dot.kind}-${i}`}
              className={`note-dot note-dot-${dot.kind}`}
              style={{ left: anchor.x - 7, top: anchor.y - 14, background: DOT_COLORS[dot.kind] }}
              title={dot.label ?? dot.kind.replace('_', ' ')}
            >
              {DOT_SYMBOLS[dot.kind] ?? ''}
            </span>
          )
        })}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
