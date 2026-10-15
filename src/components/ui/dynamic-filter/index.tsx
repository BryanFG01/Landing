"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { CalendarInput } from "../calendar"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FilterOption {
  label: string
  value: string
}

export type FilterType =
  | "text"
  | "select"
  | "multiselect"
  | "date"
  | "daterange"
  | "boolean"
  | "number"

export interface FilterConfig {
  key: string
  label: string
  type: FilterType
  placeholder?: string
  options?: FilterOption[]
  min?: string | number
  max?: string | number
}

export type FilterValue =
  | string
  | string[]
  | boolean
  | { from?: string; to?: string }

export type FilterValues = Record<string, FilterValue | undefined>

export interface DynamicFilterProps {
  filters: FilterConfig[]
  value?: FilterValues
  onChange?: (values: FilterValues) => void
  className?: string
  defaultExpanded?: boolean
  title?: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function countActive(values: FilterValues): number {
  return Object.values(values).filter((v) => {
    if (v === undefined || v === "" || v === false) return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === "object") return !!v.from || !!v.to
    return true
  }).length
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function XSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

// ─── Base input class ──────────────────────────────────────────────────────────

const inputCls = [
  "flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm",
  "text-foreground placeholder:text-muted-foreground",
  "outline-none transition-colors",
  "focus:border-primary focus:ring-1 focus:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ")

// ─── Field components ──────────────────────────────────────────────────────────

function TextField({ filter, value, onChange }: {
  filter: FilterConfig
  value: string | undefined
  onChange: (v: string | undefined) => void
}) {
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <SearchIcon />
      </span>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={filter.placeholder ?? `Buscar...`}
        className={cn(inputCls, "pl-8")}
      />
    </div>
  )
}

const DONUT_SIZE = 40
const DONUT_STROKE = 5
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS

function angleToFraction(cx: number, cy: number, clientX: number, clientY: number) {
  const dx = clientX - cx
  const dy = clientY - cy
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
  if (deg < 0) deg += 360
  return deg / 360
}

function DonutNumberField({ filter, value, onChange }: {
  filter: FilterConfig
  value: string | undefined
  onChange: (v: string | undefined) => void
}) {
  const min = Number(filter.min)
  const max = Number(filter.max)
  const numericValue = value !== undefined && value !== "" ? Number(value) : undefined
  const displayValue = numericValue ?? min
  const fraction = max > min ? Math.min(1, Math.max(0, (displayValue - min) / (max - min))) : 0

  const dialRef = React.useRef<HTMLDivElement>(null)

  function commitFromPointer(clientX: number, clientY: number) {
    const el = dialRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const frac = angleToFraction(rect.left + rect.width / 2, rect.top + rect.height / 2, clientX, clientY)
    const raw = Math.round(min + frac * (max - min))
    onChange(String(Math.min(max, Math.max(min, raw))))
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    commitFromPointer(e.clientX, e.clientY)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return
    commitFromPointer(e.clientX, e.clientY)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    let next = displayValue
    if (e.key === "ArrowUp" || e.key === "ArrowRight") next = Math.min(max, displayValue + 1)
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") next = Math.max(min, displayValue - 1)
    else if (e.key === "Home") next = min
    else if (e.key === "End") next = max
    else return
    e.preventDefault()
    onChange(String(next))
  }

  return (
    <div className="flex items-center gap-3">
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label={filter.label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={displayValue}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative h-9 w-9 shrink-0 touch-none select-none rounded-full",
          "cursor-grab active:cursor-grabbing",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        )}
      >
        <svg viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`} className="h-full w-full -rotate-90">
          <circle
            cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
            fill="none" stroke="currentColor" strokeWidth={DONUT_STROKE}
            className="text-muted"
          />
          <circle
            cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
            fill="none" stroke="currentColor" strokeWidth={DONUT_STROKE}
            strokeLinecap="round"
            strokeDasharray={DONUT_CIRCUMFERENCE}
            strokeDashoffset={DONUT_CIRCUMFERENCE * (1 - fraction)}
            className="text-primary transition-[stroke-dashoffset] duration-150 ease-out"
          />
        </svg>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
          {displayValue}
        </span>
      </div>

      <span className="text-xs text-muted-foreground">
        {numericValue === undefined ? `Sin mínimo (${min}–${max})` : `≥ ${displayValue}`}
      </span>
    </div>
  )
}

function NumberField({ filter, value, onChange }: {
  filter: FilterConfig
  value: string | undefined
  onChange: (v: string | undefined) => void
}) {
  const hasRange = filter.min !== undefined && filter.max !== undefined

  if (hasRange) {
    return <DonutNumberField filter={filter} value={value} onChange={onChange} />
  }

  return (
    <input
      type="number"
      value={value ?? ""}
      min={filter.min}
      max={filter.max}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder={filter.placeholder ?? "0"}
      className={cn(
        inputCls,
        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      )}
    />
  )
}

function SelectField({ filter, value, onChange }: {
  filter: FilterConfig
  value: string | undefined
  onChange: (v: string | undefined) => void
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selected = filter.options?.find((o) => o.value === value)
  const triggerLabel = selected?.label ?? (filter.placeholder ?? "Todos")

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          inputCls,
          "flex items-center justify-between cursor-pointer",
          open && "border-primary ring-1 ring-ring",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-full rounded-md border border-border bg-background shadow-lg py-1 max-h-52 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(undefined); setOpen(false) }}
            className={cn(
              "w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
              !value ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {filter.placeholder ?? "Todos"}
          </button>
          {filter.options?.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                "w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
                value === opt.value
                  ? "font-semibold text-primary bg-primary/5"
                  : "text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MultiSelectField({ filter, value, onChange }: {
  filter: FilterConfig
  value: string[] | undefined
  onChange: (v: string[] | undefined) => void
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const selected = value ?? []

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function toggle(optValue: string) {
    const next = selected.includes(optValue)
      ? selected.filter((v) => v !== optValue)
      : [...selected, optValue]
    onChange(next.length ? next : undefined)
  }

  const triggerLabel =
    selected.length === 0
      ? (filter.placeholder ?? "Seleccionar...")
      : `${selected.length} seleccionado${selected.length > 1 ? "s" : ""}`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          inputCls,
          "flex items-center justify-between cursor-pointer",
          open && "border-primary ring-1 ring-ring",
          selected.length === 0 && "text-muted-foreground"
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-full rounded-md border border-border bg-background shadow-lg py-1 max-h-52 overflow-y-auto">
          {filter.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted text-foreground select-none"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              {opt.label}
            </label>
          ))}
          {!filter.options?.length && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin opciones</p>
          )}
        </div>
      )}
    </div>
  )
}

function DateField({ filter, value, onChange }: {
  filter: FilterConfig
  value: string | undefined
  onChange: (v: string | undefined) => void
}) {
  return (
    <CalendarInput
      value={value}
      onChange={onChange}
      min={filter.min as string | undefined}
      max={filter.max as string | undefined}
    />
  )
}

function DateRangeField({ filter, value, onChange }: {
  filter: FilterConfig
  value: { from?: string; to?: string } | undefined
  onChange: (v: { from?: string; to?: string } | undefined) => void
}) {
  const from = value?.from
  const to   = value?.to

  function update(field: "from" | "to", val: string | undefined) {
    const next = { ...(value ?? {}), [field]: val }
    // clear key if undefined
    if (!next.from) delete next.from
    if (!next.to)   delete next.to
    onChange(Object.keys(next).length === 0 ? undefined : next)
  }

  return (
    <div className="flex items-center gap-1.5">
      <CalendarInput
        value={from}
        onChange={(v) => update("from", v)}
        placeholder="Desde"
        max={to ?? (filter.max as string | undefined)}
        min={filter.min as string | undefined}
        className="flex-1 min-w-0"
      />
      <span className="shrink-0 text-xs text-muted-foreground">—</span>
      <CalendarInput
        value={to}
        onChange={(v) => update("to", v)}
        placeholder="Hasta"
        min={from ?? (filter.min as string | undefined)}
        max={filter.max as string | undefined}
        className="flex-1 min-w-0"
      />
    </div>
  )
}

function BooleanField({ filter, value, onChange }: {
  filter: FilterConfig
  value: boolean | undefined
  onChange: (v: boolean | undefined) => void
}) {
  const checked = !!value
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={filter.label}
      onClick={() => onChange(checked ? undefined : true)}
      className={cn(
        "relative inline-flex h-9 w-full items-center gap-3 rounded-md border px-3 text-sm transition-colors",
        checked
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-muted-foreground/50"
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </span>
      <span className="truncate">{filter.placeholder ?? filter.label}</span>
    </button>
  )
}

// ─── Field dispatcher ──────────────────────────────────────────────────────────

function FilterField({ filter, value, onChange }: {
  filter: FilterConfig
  value: FilterValue | undefined
  onChange: (v: FilterValue | undefined) => void
}) {
  switch (filter.type) {
    case "text":
      return <TextField filter={filter} value={value as string | undefined} onChange={onChange} />
    case "number":
      return <NumberField filter={filter} value={value as string | undefined} onChange={onChange} />
    case "select":
      return <SelectField filter={filter} value={value as string | undefined} onChange={onChange} />
    case "multiselect":
      return <MultiSelectField filter={filter} value={value as string[] | undefined} onChange={onChange} />
    case "date":
      return <DateField filter={filter} value={value as string | undefined} onChange={onChange} />
    case "daterange":
      return <DateRangeField filter={filter} value={value as { from?: string; to?: string } | undefined} onChange={onChange} />
    case "boolean":
      return <BooleanField filter={filter} value={value as boolean | undefined} onChange={onChange} />
    default:
      return null
  }
}

// ─── DynamicFilter ─────────────────────────────────────────────────────────────

export function DynamicFilter({
  filters,
  value = {},
  onChange,
  className,
  defaultExpanded = true,
  title = "Filtros",
}: DynamicFilterProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded)
  const activeCount = countActive(value)

  function handleChange(key: string, fieldValue: FilterValue | undefined) {
    onChange?.({ ...value, [key]: fieldValue })
  }

  function clearAll() {
    onChange?.({})
  }

  return (
    <div className={cn("rounded-lg border border-border bg-background", className)}>
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="text-sm font-semibold text-foreground">{title}</span>

        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <XSmallIcon />
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            aria-expanded={expanded}
            aria-label={expanded ? "Ocultar filtros" : "Mostrar filtros"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronIcon open={expanded} />
          </button>
        </div>
      </div>

      {/* ── Fields ── */}
      {expanded && (
        <>
          <div className="border-t border-border" />
          <div className="flex flex-wrap gap-3 p-4">
            {filters.map((filter) => (
              <div
                key={filter.key}
                className={cn(
                  "flex flex-col gap-1.5",
                  filter.type === "daterange" ? "min-w-[280px] flex-[2]" :
                  filter.type === "boolean"   ? "min-w-[160px] flex-1"  :
                                                "min-w-[180px] flex-1"
                )}
              >
                <label className="text-xs font-medium text-muted-foreground leading-none">
                  {filter.label}
                </label>
                <FilterField
                  filter={filter}
                  value={value[filter.key]}
                  onChange={(v) => handleChange(filter.key, v)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
