import type * as React from "react"
import { CloudOff, Inbox, RotateCw, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Estados vacío y error compartidos por tablas y paneles.
function FeedbackState({
  icon: Icon,
  tone = "neutral",
  title,
  description,
  action,
  compact,
  className,
}: {
  icon: LucideIcon
  tone?: "neutral" | "danger"
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  compact?: boolean
  className?: string
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-16",
        className
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full",
          compact ? "size-10" : "size-12",
          tone === "danger" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"
        )}
      >
        <Icon className={compact ? "size-5" : "size-6"} />
      </span>
      <div className="max-w-sm">
        <p className="font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function EmptyState({
  title = "No hay registros",
  description,
  action,
  compact,
  icon = Inbox,
  className,
}: {
  title?: string
  description?: React.ReactNode
  action?: React.ReactNode
  compact?: boolean
  icon?: LucideIcon
  className?: string
}) {
  return (
    <FeedbackState icon={icon} title={title} description={description} action={action} compact={compact} className={className} />
  )
}

function ErrorState({
  title = "No se pudieron cargar los datos",
  description = "Revisa tu conexión. Si el problema continúa, el servidor podría no estar disponible.",
  onRetry,
  compact,
  className,
}: {
  title?: string
  description?: React.ReactNode
  onRetry?: () => void
  compact?: boolean
  className?: string
}) {
  return (
    <FeedbackState
      icon={CloudOff}
      tone="danger"
      title={title}
      description={description}
      compact={compact}
      className={className}
      action={
        onRetry && (
          <Button variant="outline" size={compact ? "sm" : "default"} onClick={onRetry}>
            <RotateCw /> Reintentar
          </Button>
        )
      }
    />
  )
}

export { EmptyState, ErrorState }
