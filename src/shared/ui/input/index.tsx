import * as React from "react"
import { cn } from "@/shared/lib/utils"
import type { InputProps, InputVariant } from './types';
import { resolveInputVariant } from './lib';

export type { InputProps, InputVariant } from './types';

// ─── Estilos por variante ─────────────────────────────────────────────────────
const variantStyles: Record<InputVariant, string> = {
  default: "border-border focus:border-primary focus:ring-primary/30",
  error:   "border-destructive focus:border-destructive focus:ring-destructive/30",
  success: "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/30",
}

// ─── Componente ───────────────────────────────────────────────────────────────
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, helperText, errorMessage, variant = "default", id, ...props },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const errorId = errorMessage ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined
    const { variant: resolvedVariant, isInvalid } = resolveInputVariant(variant, errorMessage)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={errorId ?? helperId}
          aria-invalid={isInvalid ? true : undefined}
          className={cn(
            "h-9 w-full rounded-md border bg-background px-3 py-1 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "transition-colors focus:outline-none focus:ring-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            variantStyles[resolvedVariant],
            className
          )}
          {...props}
        />
        {errorMessage ? (
          <p id={errorId} className="text-xs text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
