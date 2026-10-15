"use client"

import * as RadixSwitch from "@radix-ui/react-switch"
import * as React from "react"
import { cn } from "../../lib/utils"

export interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  id?: string
  className?: string
}

export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  label,
  description,
  id,
  className,
}: SwitchProps) {
  const generatedId = React.useId()
  const fieldId     = id ?? generatedId

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <RadixSwitch.Root
        id={fieldId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "bg-muted data-[state=checked]:bg-primary"
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0",
            "transition-transform duration-200 ease-in-out",
            "translate-x-0 data-[state=checked]:translate-x-4"
          )}
        />
      </RadixSwitch.Root>

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
