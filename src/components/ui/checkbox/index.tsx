"use client"

import * as RadixCheckbox from "@radix-ui/react-checkbox"
import * as React from "react"
import { cn } from "../../lib/utils"

export interface CheckboxProps {
  checked?: boolean | "indeterminate"
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean | "indeterminate") => void
  label?: string
  description?: string
  disabled?: boolean
  id?: string
  className?: string
}

export function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
  className,
}: CheckboxProps) {
  const generatedId = React.useId()
  const fieldId     = id ?? generatedId

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <RadixCheckbox.Root
        id={fieldId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 rounded border border-input bg-background transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
          "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary"
        )}
      >
        <RadixCheckbox.Indicator className="flex items-center justify-center text-primary-foreground">
          {checked === "indeterminate" ? (
            <svg width="8" height="2" viewBox="0 0 8 2" fill="currentColor" aria-hidden>
              <rect width="8" height="2" rx="1"/>
            </svg>
          ) : (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="1 4 3.5 6.5 9 1"/>
            </svg>
          )}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>

      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label
              htmlFor={fieldId}
              className={cn(
                "text-sm font-medium leading-tight text-foreground cursor-pointer",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={cn("mt-0.5 text-xs text-muted-foreground", disabled && "opacity-50")}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
