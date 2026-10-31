import type * as React from "react"
import { CircleAlert, Info, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

const TONES = {
  info: { box: "bg-primary-soft border-primary-200 text-primary-ink", icon: Info },
  warning: { box: "bg-warning-soft border-warning-border text-warning-ink", icon: TriangleAlert },
  danger: { box: "bg-danger-soft border-danger/30 text-danger", icon: CircleAlert },
}

function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof TONES
  title?: React.ReactNode
  children?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  const { box, icon: Icon } = TONES[tone]
  return (
    <div
      role={tone === "info" ? "status" : "alert"}
      className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", box, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-foreground/90")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export { Alert }
