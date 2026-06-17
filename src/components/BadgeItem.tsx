import type { Badge } from '../lib/badges'

interface BadgeItemProps {
  badge: Badge | Omit<Badge, 'earned' | 'earnedAt'>
  /** Force the earned appearance (used in the About catalog) */
  alwaysEarned?: boolean
}

export function BadgeItem({ badge, alwaysEarned = false }: BadgeItemProps) {
  const earned = alwaysEarned || ('earned' in badge && badge.earned)
  const gradId = `bg-${badge.id}`
  const fontSize = badge.symbol.length > 2 ? '11' : badge.symbol.length > 1 ? '14' : '20'

  return (
    <div className={`badge-item${earned ? ' badge-earned' : ''}`} title={badge.description}>
      <svg className="badge-svg" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={gradId} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor={`hsl(${badge.hue}, 100%, 82%)`} />
            <stop offset="100%" stopColor={`hsl(${(badge.hue + 45) % 360}, 88%, 42%)`} />
          </radialGradient>
        </defs>
        <circle
          cx="30" cy="30" r="28"
          fill={earned ? `url(#${gradId})` : '#d1d5db'}
          stroke={earned ? `hsl(${badge.hue}, 65%, 48%)` : '#b0b7c3'}
          strokeWidth="2.5"
        />
        <circle
          cx="30" cy="30" r="23"
          fill="none"
          stroke={earned ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.15)'}
          strokeWidth="1.5"
        />
        <text
          x="30" y="37"
          textAnchor="middle"
          fontSize={fontSize}
          fontFamily="Georgia, serif"
          fontWeight="700"
          fill={earned ? 'white' : '#aab0bb'}
        >
          {badge.symbol}
        </text>
      </svg>
      <span className="badge-name">{badge.name}</span>
    </div>
  )
}
