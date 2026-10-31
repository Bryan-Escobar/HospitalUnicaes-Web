import * as ProgressPrimitive from "@radix-ui/react-progress"

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
    <ProgressPrimitive.Root
      data-slot="progress"
      value={Math.min(value, max)}
      max={max > 0 ? max : 100}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted ring-1 ring-border/60 ring-inset", className)}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full rounded-full bg-primary transition-[width] duration-500", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
