import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

// Chip de filtro conmutable (píldora, alto 32). Seleccionado = teal suave + check.
function FilterChip({ selected, className, children, ...props }: React.ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
        selected
          ? "border-primary bg-primary-soft text-primary-ink"
          : "border-border-strong bg-card text-foreground hover:bg-muted",
        className
      )}
      {...props}
    >
      {selected && <Check className="size-3.5" strokeWidth={2.5} />}
      {children}
    </button>
  )
}

export { FilterChip }
