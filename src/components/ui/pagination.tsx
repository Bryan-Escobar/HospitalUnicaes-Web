import { cn } from "@/lib/utils"

// Pie de tabla: «Mostrando 1–10 de 212» + ‹ Anterior · 1 2 3 … 22 · Siguiente ›
function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  summary,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  summary?: string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span>{summary ?? `Mostrando ${from}–${to} de ${total}`}</span>
      <nav aria-label="Paginación" className="flex items-center gap-1">
        <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ‹ Anterior
        </PageButton>
        <span aria-hidden>·</span>
        {pageList(page, pages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} aria-hidden>
              …
            </span>
          ) : (
            <PageButton key={p} current={p === page} onClick={() => onPageChange(p)}>
              {p}
            </PageButton>
          )
        )}
        <span aria-hidden>·</span>
        <PageButton disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Siguiente ›
        </PageButton>
      </nav>
    </div>
  )
}

function PageButton({ current, className, ...props }: React.ComponentProps<"button"> & { current?: boolean }) {
  return (
    <button
      type="button"
      aria-current={current ? "page" : undefined}
      className={cn(
        "min-w-6 rounded-sm px-1 py-0.5 text-xs text-foreground hover:bg-muted disabled:text-subtle-foreground disabled:hover:bg-transparent",
        current && "bg-primary-100 font-semibold text-primary-ink",
        className
      )}
      {...props}
    />
  )
}

function pageList(page: number, pages: number): (number | "…")[] {
  if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1)
  const sorted = [...new Set([1, 2, 3, page, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b)
  const out: (number | "…")[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push("…")
    out.push(p)
  })
  return out
}

export { Pagination }
