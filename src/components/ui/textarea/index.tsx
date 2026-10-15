"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const textareaVariants = cva(
  "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error:   "border-destructive focus:ring-destructive/40",
        success: "border-green-500 focus:ring-green-500/40",
      },
      resize: {
        none:     "resize-none",
        vertical: "resize-y",
        both:     "resize",
      },
    },
    defaultVariants: { variant: "default", resize: "vertical" },
  }
)

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">,
    VariantProps<typeof textareaVariants> {
  label?: string
  helperText?: string
  errorMessage?: string
  successMessage?: string
  className?: string
}

export function Textarea({
  label,
  helperText,
  errorMessage,
  successMessage,
  variant,
  resize,
  id,
  className,
  ...props
}: TextareaProps) {
  const generatedId = React.useId()
  const fieldId     = id ?? generatedId

  const resolvedVariant = errorMessage ? "error" : successMessage ? "success" : variant

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <textarea
        id={fieldId}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage || helperText || successMessage ? `${fieldId}-help` : undefined}
        className={cn(textareaVariants({ variant: resolvedVariant, resize }), className)}
        {...props}
      />

      {(errorMessage || successMessage || helperText) && (
        <p
          id={`${fieldId}-help`}
          className={cn(
            "text-xs",
            errorMessage   ? "text-destructive" :
            successMessage ? "text-green-600 dark:text-green-400" :
                             "text-muted-foreground"
          )}
        >
          {errorMessage ?? successMessage ?? helperText}
        </p>
      )}
    </div>
  )
}
