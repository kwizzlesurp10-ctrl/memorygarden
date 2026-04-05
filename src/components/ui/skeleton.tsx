import { cn } from "@/lib/utils"
import { ComponentProps } from "react"

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-lg bg-gradient-to-r from-muted via-primary/5 to-muted bg-[length:200%_100%]", className)}
      {...props}
    />
  )
}

export { Skeleton }
