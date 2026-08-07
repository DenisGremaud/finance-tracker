import { formatCurrency, formatCurrencyCompact } from "@/lib/format"

export interface BarChartDatum {
  label: string
  value: number
  highlighted?: boolean
}

interface BarChartProps {
  data: BarChartDatum[]
}

/**
 * Bars are laid out with flexbox rather than SVG so they scale to any container
 * width without distorting the rounded corners.
 */
export function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 0)
  const scale = max > 0 ? max * 1.15 : 1

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-44 items-stretch gap-1.5">
        {/* Reference lines sit behind the bars to give the eye a baseline. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          <div className="border-border/70 flex items-center gap-2 border-t border-dashed">
            <span className="text-muted-foreground bg-card -mt-2 pr-1 text-[0.6875rem]">
              {formatCurrencyCompact(scale)}
            </span>
          </div>
          <div className="border-border border-t" />
        </div>

        {data.map((d) => (
          <div key={d.label} className="group relative flex flex-1 flex-col justify-end">
            <span className="text-foreground num pointer-events-none absolute inset-x-0 -top-1 z-10 text-center text-[0.6875rem] font-medium opacity-0 transition-opacity group-hover:opacity-100">
              {formatCurrency(d.value)}
            </span>
            <div
              className={
                d.highlighted
                  ? "bg-primary w-full rounded-t-[3px] transition-colors"
                  : "bg-primary/25 group-hover:bg-primary/40 w-full rounded-t-[3px] transition-colors"
              }
              style={{ height: `${Math.max((d.value / scale) * 100, d.value > 0 ? 2 : 0)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        {data.map((d) => (
          <span
            key={d.label}
            className={
              d.highlighted
                ? "text-foreground flex-1 text-center text-[0.6875rem] font-medium"
                : "text-muted-foreground flex-1 text-center text-[0.6875rem]"
            }
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
