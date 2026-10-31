import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Botones Web: alto 40 px, radio 10, foco de 2 px teal. El rojo solo para acciones destructivas o de emergencia.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors disabled:pointer-events-none disabled:bg-muted disabled:text-subtle-foreground disabled:border-transparent [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive: "bg-danger text-white hover:opacity-90",
        outline: "border border-border-strong bg-card text-foreground font-medium hover:bg-muted",
        secondary: "bg-muted text-foreground font-medium hover:bg-border",
        ghost: "text-foreground font-medium hover:bg-muted",
        link: "text-primary font-medium underline-offset-4 hover:underline h-auto px-0",
        "link-danger": "text-danger font-medium underline-offset-4 hover:underline h-auto px-0",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-sm gap-1.5 px-3 text-[13px]",
        lg: "h-11 px-6",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
