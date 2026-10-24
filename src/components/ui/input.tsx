import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-subtle-foreground selection:bg-primary-100 flex h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors outline-none",
        "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary/30",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-subtle-foreground",
        "aria-invalid:border-danger aria-invalid:outline-danger/30",
        className
      )}
      {...props}
    />
  )
}

// Campo de búsqueda con lupa, usado en la barra superior y en los filtros de las tablas.
function SearchInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground" />
      <Input type="search" className="pl-9" {...props} />
    </div>
  )
}

export { Input, SearchInput }
