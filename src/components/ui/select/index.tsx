"use client"

import * as RadixDropdown from "@radix-ui/react-dropdown-menu"
import * as RadixSelect from "@radix-ui/react-select"
import * as React from "react"
import { cn } from "../../lib/utils"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectGroup {
  label?: string
  options: SelectOption[]
}

export interface SelectProps {
  options?: SelectOption[]
  groups?: SelectGroup[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  helperText?: string
  errorMessage?: string
  id?: string
  className?: string
}

export interface MultiSelectProps {
  options?: SelectOption[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  helperText?: string
  errorMessage?: string
  id?: string
  className?: string
  selectAllLabel?: string
}

function ChevronDown() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 12 15 18 9"/></svg>
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12"/></svg>
}

export function Select({
  options = [],
  groups = [],
  value,
  defaultValue,
  onValueChange,
  placeholder = "Seleccionar...",
  disabled,
  label,
  helperText,
  errorMessage,
  id,
  className,
}: SelectProps) {
  const generatedId = React.useId()
  const fieldId     = id ?? generatedId

  const allGroups: SelectGroup[] = groups.length
    ? groups
    : [{ options }]

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          id={fieldId}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border px-3 text-sm",
            "bg-background text-foreground transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "data-[placeholder]:text-muted-foreground",
            errorMessage ? "border-destructive focus:ring-destructive/40" : "border-input"
          )}
          aria-invalid={!!errorMessage}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon className="text-muted-foreground">
            <ChevronDown />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className={cn(
              "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-background shadow-xl",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            )}
          >
            <RadixSelect.Viewport className="p-1">
              {allGroups.map((group, gi) => (
                <RadixSelect.Group key={gi}>
                  {group.label && (
                    <RadixSelect.Label className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {group.label}
                    </RadixSelect.Label>
                  )}
                  {group.options.map(opt => (
                    <RadixSelect.Item
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 text-sm outline-none",
                        "text-foreground transition-colors",
                        "focus:bg-primary/10 focus:text-primary",
                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
                      )}
                    >
                      <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                      <RadixSelect.ItemIndicator>
                        <CheckIcon />
                      </RadixSelect.ItemIndicator>
                    </RadixSelect.Item>
                  ))}
                  {gi < allGroups.length - 1 && (
                    <RadixSelect.Separator className="my-1 h-px bg-border" />
                  )}
                </RadixSelect.Group>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {(errorMessage || helperText) && (
        <p className={cn("text-xs", errorMessage ? "text-destructive" : "text-muted-foreground")}>
          {errorMessage ?? helperText}
        </p>
      )}
    </div>
  )
}

function MultiChevronDown() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 12 15 18 9"/></svg>
}

function MultiSelectCheckbox({ state }: { state: boolean | "indeterminate" }) {
  return (
    <span
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input bg-background transition-colors",
        state !== false && "border-primary bg-primary text-primary-foreground"
      )}
      aria-hidden
    >
      {state === "indeterminate" ? (
        <svg width="8" height="2" viewBox="0 0 8 2" fill="currentColor" aria-hidden><rect width="8" height="2" rx="1"/></svg>
      ) : state === true ? (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="1 4 3.5 6.5 9 1"/></svg>
      ) : null}
    </span>
  )
}

export function MultiSelect({
  options = [],
  value,
  defaultValue = [],
  onValueChange,
  placeholder = "Seleccionar...",
  disabled,
  label,
  helperText,
  errorMessage,
  id,
  className,
  selectAllLabel = "Seleccionar todo",
}: MultiSelectProps) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId
  const isControlled = value !== undefined
  const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue)
  const currentValues = isControlled ? value! : selectedValues

  React.useEffect(() => {
    if (!isControlled) {
      setSelectedValues(defaultValue)
    }
  }, [defaultValue, isControlled])

  const enabledOptions = options.filter((opt) => !opt.disabled)
  const enabledValues = enabledOptions.map((opt) => opt.value)
  const allSelected = enabledValues.length > 0 && enabledValues.every((v) => currentValues.includes(v))
  const someSelected = currentValues.length > 0 && !allSelected

  const setValues = (next: string[]) => {
    if (!isControlled) {
      setSelectedValues(next)
    }
    onValueChange?.(next)
  }

  const toggleOption = (optionValue: string) => {
    const next = currentValues.includes(optionValue)
      ? currentValues.filter((value) => value !== optionValue)
      : [...currentValues, optionValue]
    setValues(next)
  }

  const toggleSelectAll = () => {
    setValues(allSelected ? [] : enabledValues)
  }

  const selectedLabels = options
    .filter((opt) => currentValues.includes(opt.value))
    .map((opt) => opt.label)

  const displayLabel = selectedLabels.length === 0
    ? placeholder
    : selectedLabels.length === 1
      ? selectedLabels[0]
      : `${selectedLabels.length} seleccionados`

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <RadixDropdown.Root>
        <RadixDropdown.Trigger asChild>
          <button
            type="button"
            id={fieldId}
            disabled={disabled}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-lg border px-3 text-sm",
              "bg-background text-foreground transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              displayLabel === placeholder ? "text-muted-foreground" : "",
              errorMessage ? "border-destructive focus:ring-destructive/40" : "border-input"
            )}
          >
            <span className="truncate">{displayLabel}</span>
            <span className="text-muted-foreground"><MultiChevronDown /></span>
          </button>
        </RadixDropdown.Trigger>

        <RadixDropdown.Portal>
          <RadixDropdown.Content
            sideOffset={8}
            align="start"
            className="z-50 min-w-[var(--radix-popper-anchor-width)] overflow-hidden rounded-lg border border-border bg-background shadow-xl"
          >
            <div className="p-3 space-y-3">
              <RadixDropdown.CheckboxItem
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleSelectAll}
                onSelect={(event) => event.preventDefault()}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors",
                  "hover:bg-muted focus:bg-muted"
                )}
              >
                <MultiSelectCheckbox state={allSelected ? true : someSelected ? "indeterminate" : false} />
                <span>{selectAllLabel}</span>
              </RadixDropdown.CheckboxItem>

              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {options.map((opt) => {
                  const checked = currentValues.includes(opt.value)
                  return (
                    <RadixDropdown.CheckboxItem
                      key={opt.value}
                      checked={checked}
                      disabled={opt.disabled}
                      onCheckedChange={() => toggleOption(opt.value)}
                      onSelect={(event) => event.preventDefault()}
                      className={cn(
                        "flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors",
                        "focus:bg-muted",
                        opt.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted",
                        checked && !opt.disabled ? "bg-primary/5" : ""
                      )}
                    >
                      <MultiSelectCheckbox state={checked} />
                      <span className="truncate">{opt.label}</span>
                    </RadixDropdown.CheckboxItem>
                  )
                })}
              </div>
            </div>
          </RadixDropdown.Content>
        </RadixDropdown.Portal>
      </RadixDropdown.Root>

      {(errorMessage || helperText) && (
        <p className={cn("text-xs", errorMessage ? "text-destructive" : "text-muted-foreground")}>
          {errorMessage ?? helperText}
        </p>
      )}
    </div>
  )
}
