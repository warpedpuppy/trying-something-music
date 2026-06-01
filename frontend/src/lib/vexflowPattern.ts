import { Barline, Beam, Dot, Formatter, Renderer, Stave, StaveNote, StaveTie, Voice } from 'vexflow'
import type { Pattern, PatternEvent } from '../api/types'
import { eventBeats } from './rhythm'

export interface NoteAnchor {
  /** Index of the event in `pattern.events` this anchor belongs to. */
  eventIndex: number
  /** Pixel position of the note head within the rendered SVG. */
  x: number
  y: number
}

export interface RenderResult {
  width: number
  height: number
  anchors: NoteAnchor[]
  /** Absolute x of the very first event (note OR rest) — the downbeat position.
   *  Used to place the Play Along downbeat arrow even when beat 1 is a rest. */
  firstEventX?: number
}

interface MeasureGroup {
  events: Array<{ event: PatternEvent; index: number }>
}

const STAVE_Y = 20
const STAVE_HEIGHT = 110

function splitIntoMeasures(pattern: Pattern, beatsPerMeasure: number): MeasureGroup[] {
  const measures: MeasureGroup[] = [{ events: [] }]
  let position = 0
  for (let i = 0; i < pattern.events.length; i++) {
    const event = pattern.events[i]
    const measureIndex = Math.floor(position / beatsPerMeasure + 1e-9)
    while (measures.length <= measureIndex) {
      measures.push({ events: [] })
    }
    measures[measureIndex].events.push({ event, index: i })
    position += eventBeats(event)
  }
  return measures.filter((m) => m.events.length > 0)
}

function toStaveNote(event: PatternEvent): StaveNote {
  const duration = event.type === 'rest' ? `${event.duration}r` : event.duration
  const note = new StaveNote({
    keys: ['b/4'],
    duration,
    clef: 'percussion',
  })
  if (event.dots) {
    Dot.buildAndAttach([note], { all: true })
  }
  return note
}

/**
 * Render a rhythm pattern as engraved notation inside `container` and return the
 * pixel position of every note head so the caller can overlay feedback dots.
 */
export function renderPattern(
  container: HTMLDivElement,
  pattern: Pattern,
  timeSigTop: number,
  timeSigBottom: number,
  options: {
    showTimeSignature?: boolean
    showClef?: boolean
    scale?: number
    fixedTotalWidth?: number
    /**
     * When set, the staff will not exceed this pixel width. If the natural
     * width (based on note count) is smaller it is used as-is; if it would
     * overflow the measures are redistributed to fit within maxWidth.
     * Use this to make the staff responsive to its container.
     */
    maxWidth?: number
    /** When true, staves fill the full fixedTotalWidth with no side margins.
     *  Eliminates the ~20px gap between adjacent blocks in a seamless reel. */
    seamless?: boolean
  } = {},
): RenderResult {
  const { showTimeSignature = true, showClef = true, fixedTotalWidth, maxWidth, seamless = false } = options
  container.innerHTML = ''

  const beatsPerMeasure = timeSigTop * (4 / timeSigBottom)
  const measures = splitIntoMeasures(pattern, beatsPerMeasure)

  // Natural per-measure widths (based on note density)
  const naturalMeasureWidths = measures.map((measure, measureIndex) => {
    const base = Math.max(140, measure.events.length * 64)
    return measureIndex === 0 ? base + 80 : base
  })
  const naturalTotalWidth = naturalMeasureWidths.reduce((a, b) => a + b, 0) + 20

  // Resolve the effective total width
  const effectiveTotalWidth = fixedTotalWidth
    ?? (maxWidth && naturalTotalWidth > maxWidth ? maxWidth : naturalTotalWidth)

  const redistribute = fixedTotalWidth != null || (maxWidth != null && naturalTotalWidth > maxWidth)

  const measureWidths = measures.map((_, measureIndex) => {
    if (redistribute) {
      if (seamless) {
        return Math.floor(effectiveTotalWidth / measures.length)
      }
      return Math.floor((effectiveTotalWidth - 20) / measures.length)
    }
    return naturalMeasureWidths[measureIndex]
  })

  const totalWidth = effectiveTotalWidth
  const height = STAVE_Y + STAVE_HEIGHT + 30

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(totalWidth, height)
  const context = renderer.getContext()

  const allNotes: StaveNote[] = []
  const noteEventIndexes: number[] = []
  let x = (fixedTotalWidth && seamless) ? 0 : 10
  let firstStaveNote: StaveNote | null = null

  measures.forEach((measure, measureIndex) => {
    const stave = new Stave(x, STAVE_Y, measureWidths[measureIndex])
    if (measureIndex === 0) {
      if (showClef) stave.addClef('percussion')
      if (showTimeSignature) {
        stave.addTimeSignature(`${timeSigTop}/${timeSigBottom}`)
      }
    }
    if (seamless) {
      // Reel mode: each block renders one measure flush against the next. Let
      // VexFlow draw no barlines (its edge barlines get clipped by the SVG); we
      // draw a single thin barline ourselves just inside the right edge below.
      stave.setBegBarType(Barline.type.NONE)
      stave.setEndBarType(Barline.type.NONE)
    } else if (measureIndex === measures.length - 1) {
      stave.setEndBarType(Barline.type.END) // thick final barline
    }
    stave.setContext(context).draw()

    const notes = measure.events.map(({ event }) => toStaveNote(event))
    const beams = Beam.generateBeams(notes.filter((note) => !note.isRest()))
    const voice = new Voice({ numBeats: timeSigTop, beatValue: timeSigBottom })
    voice.setMode(Voice.Mode.SOFT)
    voice.addTickables(notes)
    new Formatter().joinVoices([voice]).formatToStave([voice], stave)
    voice.draw(context, stave)
    beams.forEach((beam) => beam.setContext(context).draw())

    if (measureIndex === 0 && notes.length > 0) firstStaveNote = notes[0]

    measure.events.forEach(({ event, index }, i) => {
      if (event.type === 'note') {
        allNotes.push(notes[i])
        noteEventIndexes.push(index)
      }
    })

    // Seamless single thin barline at the right edge (staff-line weight), drawn
    // ~1px inside so the SVG viewport doesn't clip it away.
    if (seamless) {
      const barX = stave.getX() + stave.getWidth() - 0.5
      const topY = stave.getYForLine(0)
      const botY = stave.getYForLine(4)
      context.save()
      context.setLineWidth(1)
      context.setStrokeStyle('#000000')
      context.beginPath()
      context.moveTo(barX, topY)
      context.lineTo(barX, botY)
      context.stroke()
      context.restore()
    }

    x += measureWidths[measureIndex]
  })

  // Ties (may cross measure boundaries).
  pattern.events.forEach((event, index) => {
    if (event.type !== 'note' || !event.tieToNext) {
      return
    }
    const fromPosition = noteEventIndexes.indexOf(index)
    const toPosition = noteEventIndexes.indexOf(index + 1)
    if (fromPosition === -1 || toPosition === -1) {
      return
    }
    new StaveTie({
      firstNote: allNotes[fromPosition],
      lastNote: allNotes[toPosition],
    })
      .setContext(context)
      .draw()
  })

  const anchors: NoteAnchor[] = allNotes.map((note, i) => ({
    eventIndex: noteEventIndexes[i],
    x: note.getAbsoluteX(),
    y: STAVE_Y,
  }))

  const firstEventX = firstStaveNote
    ? (firstStaveNote as StaveNote).getAbsoluteX()
    : undefined

  return { width: totalWidth, height, anchors, firstEventX }
}
