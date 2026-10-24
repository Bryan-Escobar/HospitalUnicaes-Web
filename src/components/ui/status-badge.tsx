import { ArrowRight, Check, Circle, Clock, Contrast, Pause, TriangleAlert, X, type LucideIcon } from "lucide-react"

import { Badge, type BadgeProps } from "@/components/ui/badge"
import { ESTADO_LABELS, type Estado } from "@/lib/estados"
import { cn } from "@/lib/utils"

// Un estado nunca se comunica solo con color: cada uno tiene texto exacto + icono.
type Glyph = LucideIcon | "dot"
type Tone = NonNullable<BadgeProps["tone"]>

const ESTILOS: Record<Estado, { tone: Tone; icon: Glyph }> = {
  // Laboratorio: Pendiente → En Proceso → Completado
  pendiente: { tone: "warning", icon: Circle },
  en_proceso: { tone: "info", icon: Contrast },
  completado: { tone: "success", icon: Check },
  // Ambulancia
  disponible: { tone: "success", icon: Check },
  en_servicio: { tone: "danger", icon: ArrowRight },
  en_mantenimiento: { tone: "neutral", icon: Pause },
  // Cama
  libre: { tone: "success", icon: Circle },
  ocupada: { tone: "neutral", icon: "dot" },
  // Cita
  programada: { tone: "info", icon: Clock },
  atendida: { tone: "success", icon: Check },
  cancelada: { tone: "neutral", icon: X },
  // Bitácora / solicitudes
  finalizado: { tone: "success", icon: Check },
  rechazada: { tone: "neutral", icon: X },
  no_disponible: { tone: "neutral", icon: X },
  // Inventario
  stock_bajo: { tone: "warning", icon: TriangleAlert },
  // Avisos
  vigente: { tone: "success", icon: "dot" },
  programado: { tone: "info", icon: Clock },
  vencido: { tone: "neutral", icon: X },
  // Usuarios y turnos
  activo: { tone: "success", icon: "dot" },
  inactivo: { tone: "neutral", icon: X },
  en_curso: { tone: "primary", icon: "dot" },
}

export function StatusBadge({
  estado,
  count,
  size = "sm",
  className,
}: {
  estado: Estado
  count?: number
  size?: "sm" | "lg"
  className?: string
}) {
  const { tone, icon } = ESTILOS[estado]
  const Icon = icon === "dot" ? null : icon
  return (
    <Badge tone={tone} className={cn(size === "lg" && "gap-1.5 px-3 py-1 text-sm leading-5", className)}>
      {Icon ? (
        <Icon aria-hidden className={size === "lg" ? "size-4" : "size-3"} strokeWidth={2.5} />
      ) : (
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
      )}
      {ESTADO_LABELS[estado]}
      {count !== undefined && <span className="tabular">{count}</span>}
    </Badge>
  )
}
