import { cn } from "@/lib/utils"

function Progress({
  value,
  max,
  className,
  barClassName,
  label,
}: {
  value: number
  max: number
  className?: string
  barClassName?: string
  label?: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted ring-1 ring-border/60 ring-inset", className)}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width] duration-500", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export { Progress }
