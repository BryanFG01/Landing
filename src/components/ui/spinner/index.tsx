"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-current border-t-transparent",
  {
    variants: {
      size: {
        xs: "h-3 w-3 border-[2px]",
        sm: "h-4 w-4 border-[2px]",
        md: "h-6 w-6 border-[3px]",
        lg: "h-8 w-8 border-[3px]",
        xl: "h-12 w-12 border-4",
      },
      variant: {
        default: "text-primary",
        muted:   "text-muted-foreground",
        white:   "text-white",
      },
    },
    defaultVariants: { size: "md", variant: "default" },
  }
)

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  label?: string
  className?: string
}

export function Spinner({ size, variant, label = "Cargando...", className }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-center justify-center", className)}>
      <span className={spinnerVariants({ size, variant })} />
      <span className="sr-only">{label}</span>
    </span>
  )
}
