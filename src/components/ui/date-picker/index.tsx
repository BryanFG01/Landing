"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { CalendarInput } from "../calendar"

export interface DatePickerProps {
  id?: string
  label?: string
  helperText?: string
  errorMessage?: string
  value?: string          // "yyyy-mm-dd"
  onChange?: (value: string | undefined) => void
  min?: string
  max?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

function DatePicker({
  id,
  label,
  helperText,
  errorMessage,
  value,
  onChange,
  min,
  max,
  disabled,
  required,
  className,
}: DatePickerProps) {
  const generatedId = React.useId()
  const inputId  = id ?? generatedId
  const hasError = !!errorMessage
  const errorId  = hasError            ? `${inputId}-error`  : undefined
  const helperId = helperText && !hasError ? `${inputId}-helper` : undefined

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
        </label>
      )}

      <CalendarInput
        id={inputId}
        value={value}
        onChange={onChange ?? (() => {})}
        min={min as string | undefined}
        max={max as string | undefined}
        disabled={disabled}
        hasError={hasError}
        aria-describedby={errorId ?? helperId}
      />

      {hasError && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {errorMessage}
        </p>
      )}
      {!hasError && helperText && (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  )
}

DatePicker.displayName = "DatePicker"
export { DatePicker }
