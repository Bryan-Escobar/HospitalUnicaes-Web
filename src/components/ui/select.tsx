import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// Select nativo con el estilo de los filtros (accesible por teclado sin dependencias extra).
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <select
        data-slot="select"
        className="h-10 w-full cursor-pointer appearance-none rounded-md border border-input bg-card py-0 pr-9 pl-3 text-sm text-foreground outline-none hover:bg-muted focus-visible:border-primary"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { Select }
