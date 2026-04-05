import { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        happy:
          "border-transparent bg-[oklch(0.78_0.14_85)]/20 text-[oklch(0.45_0.12_75)] dark:bg-[oklch(0.78_0.14_85)]/15 dark:text-[oklch(0.85_0.12_85)]",
        reflective:
          "border-transparent bg-[oklch(0.60_0.12_240)]/20 text-[oklch(0.35_0.10_240)] dark:bg-[oklch(0.60_0.12_240)]/15 dark:text-[oklch(0.75_0.10_240)]",
        bittersweet:
          "border-transparent bg-[oklch(0.70_0.15_340)]/20 text-[oklch(0.45_0.13_340)] dark:bg-[oklch(0.70_0.15_340)]/15 dark:text-[oklch(0.80_0.13_340)]",
        peaceful:
          "border-transparent bg-primary/15 text-primary dark:bg-primary/10",
        nostalgic:
          "border-transparent bg-[oklch(0.65_0.10_60)]/20 text-[oklch(0.42_0.09_60)] dark:bg-[oklch(0.65_0.10_60)]/15 dark:text-[oklch(0.78_0.09_60)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
