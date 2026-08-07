interface BarChartDatum {
  label: string
  value: number
}

interface BarChartProps {
  data: BarChartDatum[]
  height?: number
  color?: string
}

export function BarChart({ data, height = 220, color = "var(--color-primary)" }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.15
  const barWidth = 100 / (data.length || 1)

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Pas encore de données</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-56 w-full">
        {data.map((d, index) => {
          const barHeight = (d.value / max) * (height - 20)
          return (
            <rect
              key={d.label}
              x={index * barWidth + barWidth * 0.15}
              y={height - 20 - barHeight}
              width={barWidth * 0.7}
              height={barHeight}
              rx={1}
              fill={color}
            />
          )
        })}
      </svg>
      <div className="flex text-xs text-muted-foreground">
        {data.map((d) => (
          <span key={d.label} style={{ width: `${barWidth}%` }} className="truncate text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
