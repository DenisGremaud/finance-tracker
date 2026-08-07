import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Renders money with the cents (and the currency symbol) de-emphasised, so the
 * significant digits carry the weight: 1 234,56 € -> **1 234**,56 €
 */
export function Amount({
  value,
  className,
  decimalsClassName,
}: {
  value: string | number
  className?: string
  decimalsClassName?: string
}) {
  const formatted = formatCurrency(value)
  const separator = formatted.lastIndexOf(",")

  if (separator === -1) {
    return <span className={cn("num", className)}>{formatted}</span>
  }

  return (
    <span className={cn("num", className)}>
      {formatted.slice(0, separator)}
      <span className={cn("text-muted-foreground", decimalsClassName)}>
        {formatted.slice(separator)}
      </span>
    </span>
  )
}
