import { formatCurrency } from "@/lib/format"

export interface DonutChartDatum {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartDatum[]
  centerLabel?: string
}

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** Small visual gap between segments, in path units. */
const GAP = 1.5

export function DonutChart({ data, centerLabel = "Total" }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null

  let offset = 0

  return (
    // Stacked rather than side-by-side: this card is narrow, and a horizontal
    // layout squeezes the category names down to zero width.
    <div className="flex flex-col items-center gap-6">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          {data.map((d) => {
            const length = (d.value / total) * CIRCUMFERENCE
            const dash = Math.max(length - GAP, 0.5)
            const segment = (
              <circle
                key={d.label}
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke={d.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += length
            return segment
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-muted-foreground text-xs">{centerLabel}</span>
          <span className="num text-base font-semibold">{formatCurrency(total)}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="min-w-0 flex-1 truncate">{d.label}</span>
            <span className="num shrink-0 font-medium">{formatCurrency(d.value)}</span>
            <span className="text-muted-foreground num w-10 shrink-0 text-right text-xs">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
