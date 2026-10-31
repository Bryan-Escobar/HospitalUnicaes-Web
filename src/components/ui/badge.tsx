import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Badge = fondo + texto + borde (+ icono en los estados). Todos los pares cumplen ≥ 6:1.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-4 font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-neutral-soft text-neutral-ink border-border-strong",
        primary: "bg-primary-soft text-primary-ink border-primary-200",
        warning: "bg-warning-soft text-warning-ink border-warning-border",
        info: "bg-info-soft text-info-ink border-info-ink/25",
        success: "bg-success-soft text-success-ink border-success-ink/25",
        danger: "bg-danger-soft text-danger border-danger/30",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
)

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
}

export { Badge }
export type { BadgeProps }
