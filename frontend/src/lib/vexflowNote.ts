/**
 * vexflowNote — renders a single pitched note on a staff.
 *
 * Used by the Notes & the Staff theory quiz.
 * The staff width is fixed; CSS scales the SVG responsively.
 */

import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow'

export function renderSingleNote(
  container: HTMLDivElement,
  key: string,             // VexFlow pitch string, e.g. 'c/4', 'g#/4'
  clef: 'treble' | 'bass',
  width = 280,
): void {
  container.innerHTML = ''

  // Fixed dimensions for both clefs so the container height never shifts on switch.
  const staveY  = 42
  const height  = 142

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()

  const stave = new Stave(8, staveY, width - 16)
  stave.addClef(clef)
  stave.setContext(context).draw()

  const note = new StaveNote({ keys: [key], duration: 'w', clef })

  // Attach any accidental that's encoded in the key string (e.g. '#', 'b')
  const accMatch = key.match(/([#bn])/)
  if (accMatch) {
    note.addModifier(new Accidental(accMatch[1]))
  }

  const voice = new Voice({ numBeats: 4, beatValue: 4 })
  voice.setMode(Voice.Mode.SOFT)
  voice.addTickables([note])
  new Formatter().joinVoices([voice]).formatToStave([voice], stave)
  voice.draw(context, stave)
}
