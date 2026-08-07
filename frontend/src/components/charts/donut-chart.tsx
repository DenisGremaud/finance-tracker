interface DonutChartDatum {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartDatum[]
  size?: number
}

export function DonutChart({ data, size = 200 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Pas encore de données</p>
  }

  const radius = size / 2
  const strokeWidth = radius * 0.35
  const innerRadius = radius - strokeWidth / 2
  const circumference = 2 * Math.PI * innerRadius

  let offset = 0

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${radius} ${radius})`}>
          {data.map((d) => {
            const fraction = d.value / total
            const dash = fraction * circumference
            const circle = (
              <circle
                key={d.label}
                cx={radius}
                cy={radius}
                r={innerRadius}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += dash
            return circle
          })}
        </g>
      </svg>
      <ul className="flex flex-col gap-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-medium">{d.value.toFixed(2)} €</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
