import { getAttempts, getMastery, getProgress } from './localDb'

export interface Badge {
  id: string
  name: string
  description: string
  symbol: string
  hue: number   // base hue for the radial gradient (rainbow spread across all badges)
  earned: boolean
  earnedAt?: string
}

const BADGE_DEFS: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  { id: 'first-tap',       name: 'First Tap',        description: 'Complete your first attempt',            symbol: '♩',   hue: 0   },
  { id: 'first-pass',      name: 'First Pass',        description: 'Pass your first exercise',              symbol: '★',   hue: 30  },
  { id: 'free-spirit',     name: 'Free Spirit',       description: 'Pass an exercise in free tempo',        symbol: '♫',   hue: 60  },
  { id: 'metronome-mate',  name: 'Metronome Mate',    description: 'Pass an exercise with the metronome',   symbol: '♩♩',  hue: 100 },
  { id: 'hat-trick',       name: 'Hat Trick',         description: 'Pass 3 exercises',                      symbol: '3',   hue: 140 },
  { id: 'level-2',         name: 'Level 2',           description: 'Unlock Level 2',                        symbol: 'II',  hue: 170 },
  { id: 'level-3',         name: 'Level 3',           description: 'Unlock Level 3',                        symbol: 'III', hue: 200 },
  { id: 'perfect',         name: 'Perfect',           description: 'Score 100% accuracy on any exercise',   symbol: '◎',   hue: 225 },
  { id: 'level-5',         name: 'Level 5',           description: 'Reach Level 5',                        symbol: 'V',   hue: 255 },
  { id: 'dedicated',       name: 'Dedicated',         description: 'Complete 10 attempts',                  symbol: '10',  hue: 285 },
  { id: 'concept-master',  name: 'Concept Master',    description: 'Master 3 concepts',                     symbol: '✓',   hue: 315 },
  { id: 'advanced',        name: 'Advanced',          description: 'Reach Level 7',                         symbol: 'VII', hue: 350 },
]

export function computeBadges(userId: number): Badge[] {
  const attempts  = getAttempts(userId)
  const progress  = getProgress(userId)
  const mastery   = getMastery(userId)

  const passed    = attempts.filter((a) => a.passed)
  const passCount = passed.length
  const masteredCount = Object.values(mastery).filter((cm) => cm.passes >= 2).length

  const earnedAt: Record<string, string | undefined> = {
    'first-tap':       attempts[0]?.createdAt,
    'first-pass':      passed[0]?.createdAt,
    'free-spirit':     passed.find((a) => a.mode === 'free')?.createdAt,
    'metronome-mate':  passed.find((a) => a.mode === 'strict')?.createdAt,
    'hat-trick':       passCount >= 3 ? passed[2].createdAt : undefined,
    'level-2':         progress.unlockedLevel >= 2 ? '' : undefined,
    'level-3':         progress.unlockedLevel >= 3 ? '' : undefined,
    'perfect':         attempts.find((a) => a.accuracy >= 0.999)?.createdAt,
    'level-5':         progress.unlockedLevel >= 5 ? '' : undefined,
    'dedicated':       attempts.length >= 10 ? attempts[9].createdAt : undefined,
    'concept-master':  masteredCount >= 3 ? '' : undefined,
    'advanced':        progress.unlockedLevel >= 7 ? '' : undefined,
  }

  return BADGE_DEFS.map((def) => ({
    ...def,
    earned:   earnedAt[def.id] !== undefined,
    earnedAt: earnedAt[def.id] || undefined,
  }))
}
