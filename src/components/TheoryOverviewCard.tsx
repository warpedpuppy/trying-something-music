interface TheoryOverviewCardProps {
  icon: string
  title: string
  description: string
  keyFact: string
  color?: string
}

export function TheoryOverviewCard({ icon, title, description, keyFact, color = '#f97316' }: TheoryOverviewCardProps) {
  return (
    <div className="th-overview-card">
      <div className="th-overview-icon" style={{ color }}>{icon}</div>
      <h2 className="th-overview-title">{title}</h2>
      <p className="th-overview-desc">{description}</p>
      <div className="th-overview-fact" style={{ borderColor: color, color }}>
        💡 {keyFact}
      </div>
    </div>
  )
}
