import { readableOn } from "@/lib/color"
import { cn } from "@/lib/utils"

/** Rounded-square tile carrying the category's colour and initial. */
export function CategoryIcon({
  name,
  color,
  className,
}: {
  name?: string | null
  color?: string | null
  className?: string
}) {
  const initial = name?.trim().charAt(0).toUpperCase() || "?"

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-[0.875rem] text-sm font-semibold",
        className
      )}
      style={{
        backgroundColor: color || "var(--muted-foreground)",
        color: readableOn(color),
      }}
      aria-hidden
    >
      {initial}
    </span>
  )
}
