import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .replace(/^(Dr|Dra)\.\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
}

// Avatar sobre Radix (shadcn): muestra la foto si hay `src` y las iniciales como respaldo.
function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string
  src?: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full",
        size === "sm" && "size-7 text-[11px]",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-16 text-xl",
        className
      )}
    >
      {src && <AvatarPrimitive.Image data-slot="avatar-image" src={src} alt="" className="aspect-square size-full object-cover" />}
      <AvatarPrimitive.Fallback
        data-slot="avatar-fallback"
        className="flex size-full items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-ink"
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

export { Avatar }
