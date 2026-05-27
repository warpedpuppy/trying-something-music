export type NoteType = 'w' | 'h' | 'q' | 'e' | 'dq'

export interface SheetNote {
  measure: number
  beat: number     // beat within measure (0-indexed)
  type: NoteType
  yPos: number     // 0 = top staff line, 8 = bottom; even = on line, odd = in space
}

export interface SheetPiece {
  id: string
  title: string
  composer: string
  timeSigTop: number
  timeSigBottom: number
  defaultBpm: number
  notes: SheetNote[]
}

function n(measure: number, beat: number, type: NoteType, yPos: number): SheetNote {
  return { measure, beat, type, yPos }
}

// yPos guide (treble clef, centered):
// 1 = space above 4th line  (A / high)
// 2 = 4th line              (G)
// 3 = 3rd space             (F / E area)
// 4 = 3rd line (middle B)   (E / D area)
// 5 = 2nd space             (D / C area)
// 6 = 2nd line              (C / B area)

export const PIECES: SheetPiece[] = [
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    composer: 'Beethoven — Symphony No. 9',
    timeSigTop: 4,
    timeSigBottom: 4,
    defaultBpm: 80,
    notes: [
      // E E F G
      n(0,0,'q',3), n(0,1,'q',3), n(0,2,'q',2), n(0,3,'q',1),
      // G F E D
      n(1,0,'q',1), n(1,1,'q',2), n(1,2,'q',3), n(1,3,'q',4),
      // C C D E
      n(2,0,'q',5), n(2,1,'q',5), n(2,2,'q',4), n(2,3,'q',3),
      // E. D D(h)
      n(3,0,'dq',3), n(3,1.5,'e',4), n(3,2,'h',4),
      // E E F G
      n(4,0,'q',3), n(4,1,'q',3), n(4,2,'q',2), n(4,3,'q',1),
      // G F E D
      n(5,0,'q',1), n(5,1,'q',2), n(5,2,'q',3), n(5,3,'q',4),
      // C C D E
      n(6,0,'q',5), n(6,1,'q',5), n(6,2,'q',4), n(6,3,'q',3),
      // D. C C(h)
      n(7,0,'dq',4), n(7,1.5,'e',5), n(7,2,'h',5),
    ],
  },
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    composer: 'Traditional',
    timeSigTop: 4,
    timeSigBottom: 4,
    defaultBpm: 90,
    notes: [
      n(0,0,'q',6), n(0,1,'q',6), n(0,2,'q',2), n(0,3,'q',2),
      n(1,0,'q',1), n(1,1,'q',1), n(1,2,'h',2),
      n(2,0,'q',3), n(2,1,'q',3), n(2,2,'q',4), n(2,3,'q',4),
      n(3,0,'q',5), n(3,1,'q',5), n(3,2,'h',6),
      n(4,0,'q',2), n(4,1,'q',2), n(4,2,'q',3), n(4,3,'q',3),
      n(5,0,'q',4), n(5,1,'q',4), n(5,2,'h',5),
      n(6,0,'q',2), n(6,1,'q',2), n(6,2,'q',3), n(6,3,'q',3),
      n(7,0,'q',4), n(7,1,'q',4), n(7,2,'h',5),
      n(8,0,'q',6), n(8,1,'q',6), n(8,2,'q',2), n(8,3,'q',2),
      n(9,0,'q',1), n(9,1,'q',1), n(9,2,'h',2),
      n(10,0,'q',3), n(10,1,'q',3), n(10,2,'q',4), n(10,3,'q',4),
      n(11,0,'q',5), n(11,1,'q',5), n(11,2,'h',6),
    ],
  },
  {
    id: 'mary-had-a-little-lamb',
    title: 'Mary Had a Little Lamb',
    composer: 'Traditional',
    timeSigTop: 4,
    timeSigBottom: 4,
    defaultBpm: 100,
    notes: [
      n(0,0,'q',3), n(0,1,'q',4), n(0,2,'q',5), n(0,3,'q',4),
      n(1,0,'q',3), n(1,1,'q',3), n(1,2,'h',3),
      n(2,0,'q',4), n(2,1,'q',4), n(2,2,'h',4),
      n(3,0,'q',3), n(3,1,'q',1), n(3,2,'h',1),
      n(4,0,'q',3), n(4,1,'q',4), n(4,2,'q',5), n(4,3,'q',4),
      n(5,0,'q',3), n(5,1,'q',3), n(5,2,'q',3), n(5,3,'q',3),
      n(6,0,'q',4), n(6,1,'q',4), n(6,2,'q',3), n(6,3,'q',4),
      n(7,0,'w',5),
    ],
  },
]
