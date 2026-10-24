import type * as React from "react"
import type { LucideIcon } from "lucide-react"

import { EmptyState, ErrorState } from "@/components/ui/feedback-state"
import { Skeleton } from "@/components/ui/skeleton"
import type { ResourceStatus } from "@/hooks/useResource"
import { cn } from "@/lib/utils"

export interface Column<T> {
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
  // Ancho de la barra del esqueleto mientras carga
  skeleton?: string
}

// Tabla de datos del panel con sus cuatro estados: carga (esqueleto), error, vacío y con datos.
function DataTable<T>({
  label,
  columns,
  rows,
  status,
  rowKey,
  onRetry,
  empty,
  footer,
  skeletonRows = 8,
  fixedLayout,
  className,
}: {
  // Columnas de ancho fijo/igual (p. ej. la grilla semanal de turnos)
  fixedLayout?: boolean
  label: string
  columns: Column<T>[]
  rows: T[] | undefined
  status: ResourceStatus
  rowKey: (row: T) => string | number
  onRetry?: () => void
  empty?: { title?: string; description?: React.ReactNode; action?: React.ReactNode; icon?: LucideIcon }
  footer?: React.ReactNode
  skeletonRows?: number
  className?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="overflow-x-auto">
        <table
          className={cn("w-full min-w-[880px] border-collapse text-left text-sm", fixedLayout && "table-fixed")}
          aria-label={label} aria-busy={status === "loading"}>
          <thead>
            <tr className="bg-surface-muted">
              {columns.map((c, i) => (
                <th
                  key={c.header || i}
                  scope="col"
                  className={cn(
                    "h-10 px-4 text-xs leading-4 font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase first:pl-4",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {status === "loading" &&
              Array.from({ length: skeletonRows }, (_, r) => (
                <tr key={r} className="h-[54px] border-t border-border">
                  {columns.map((c, i) => (
                    <td key={i} className={cn("px-4", c.className)}>
                      <Skeleton className={cn("h-3.5", c.skeleton ?? (i === 0 ? "w-36" : "w-20"))} />
                    </td>
                  ))}
                </tr>
              ))}

            {status === "error" && (
              <tr className="border-t border-border">
                <td colSpan={columns.length}>
                  <ErrorState onRetry={onRetry} />
                </td>
              </tr>
            )}

            {status === "empty" && (
              <tr className="border-t border-border">
                <td colSpan={columns.length}>
                  <EmptyState {...empty} />
                </td>
              </tr>
            )}

            {status === "success" &&
              rows?.map((row) => (
                <tr key={rowKey(row)} className="h-[54px] border-t border-border transition-colors hover:bg-surface-muted/70">
                  {columns.map((c, i) => (
                    <td key={i} className={cn("px-4 py-2 text-foreground", c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {status === "success" && footer}
      {status === "loading" && <span className="sr-only" role="status">Cargando {label.toLowerCase()}…</span>}
    </div>
  )
}

export { DataTable }
