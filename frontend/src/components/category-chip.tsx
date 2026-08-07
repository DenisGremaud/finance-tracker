import { CategoryDot } from "@/components/category-dot"
import { cn } from "@/lib/utils"

/**
 * The label keeps the normal foreground colour and only the background is
 * tinted — category colours are user-picked, so colouring the text itself
 * would go unreadable as soon as someone chooses something very dark or pale.
 */
export function CategoryChip({
  name,
  color,
  className,
}: {
  name: string
  color?: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: color
          ? `color-mix(in oklch, ${color} 14%, transparent)`
          : "var(--muted)",
      }}
    >
      <CategoryDot color={color} className="size-2" />
      <span className="truncate">{name}</span>
    </span>
  )
}
