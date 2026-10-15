"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]
const DAYS = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function pad(n: number) { return String(n).padStart(2, "0") }

function toIso(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

function buildGrid(year: number, month: number) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()

  const cells: { iso: string; current: boolean; day: number }[] = []

  // Previous month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const [y, m] = month === 0 ? [year - 1, 11] : [year, month - 1]
    cells.push({ iso: toIso(y, m, d), current: false, day: d })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIso(year, month, d), current: true, day: d })
  }
  // Next month head (fill to 42 slots)
  const [ny, nm] = month === 11 ? [year + 1, 0] : [year, month + 1]
  for (let d = 1; cells.length < 42; d++) {
    cells.push({ iso: toIso(ny, nm, d), current: false, day: d })
  }
  return cells
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronL() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
function ChevronR() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
function CalendarSVG({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

export interface CalendarProps {
  value?: string                      // "yyyy-mm-dd"
  onChange: (date: string | undefined) => void
  min?: string
  max?: string
  onClose?: () => void
}

export function Calendar({ value, onChange, min, max, onClose }: CalendarProps) {
  const today = todayStr()
  const seed  = value ?? today

  const [year,  setYear]  = React.useState(() => parseInt(seed.slice(0, 4)))
  const [month, setMonth] = React.useState(() => parseInt(seed.slice(5, 7)) - 1)
  const [yearMode, setYearMode] = React.useState(false)

  const cells = buildGrid(year, month)
  const yearRange = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i)

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function disabled(iso: string) {
    if (min && iso < min) return true
    if (max && iso > max) return true
    return false
  }

  function select(iso: string) {
    if (disabled(iso)) return
    onChange(iso)
    onClose?.()
  }

  return (
    <div className="w-[288px] select-none rounded-xl border border-border bg-background p-4 shadow-2xl">

      {/* ── Header ── */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronL />
        </button>

        <button
          type="button"
          onClick={() => setYearMode(m => !m)}
          className="rounded-md px-2 py-1 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          {MONTHS[month]} {year}
        </button>

        <button
          type="button"
          onClick={next}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronR />
        </button>
      </div>

      {yearMode ? (
        /* ── Year grid ── */
        <div className="grid grid-cols-4 gap-1">
          {yearRange.map(y => (
            <button
              key={y}
              type="button"
              onClick={() => { setYear(y); setYearMode(false) }}
              className={cn(
                "rounded-lg py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                y === year
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-foreground"
              )}
            >
              {y}
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* ── Day headers ── */}
          <div className="mb-1 grid grid-cols-7">
            {DAYS.map(d => (
              <div key={d} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* ── Day grid ── */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map(({ iso, current, day }) => {
              const selected = value === iso
              const isToday  = today === iso
              const off      = disabled(iso)
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={off}
                  onClick={() => select(iso)}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg text-sm transition-colors",
                    // out-of-month days
                    !current && "text-muted-foreground/30",
                    // normal in-month day
                    current && !selected && !off && "hover:bg-muted text-foreground",
                    // selected
                    selected && "bg-primary text-primary-foreground font-semibold shadow-md",
                    // today (not selected)
                    isToday && !selected && "ring-1 ring-primary text-primary font-semibold",
                    // disabled
                    off && "cursor-not-allowed opacity-25",
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <button
          type="button"
          onClick={() => { onChange(undefined); onClose?.() }}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Borrar
        </button>
        <button
          type="button"
          onClick={() => select(today)}
          className="text-xs font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Hoy
        </button>
      </div>
    </div>
  )
}

// ─── CalendarInput ────────────────────────────────────────────────────────────
// Input + popup ready para usar directamente

export interface CalendarInputProps {
  value?: string
  onChange: (v: string | undefined) => void
  placeholder?: string
  min?: string
  max?: string
  disabled?: boolean
  id?: string
  className?: string
  hasError?: boolean
}

export function CalendarInput({
  value, onChange, placeholder, min, max,
  disabled, id, className, hasError,
}: CalendarInputProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // yyyy-mm-dd → dd/mm/yyyy
  const display = value
    ? `${value.slice(8)}/${value.slice(5, 7)}/${value.slice(0, 4)}`
    : ""

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => !disabled && setOpen(p => !p)}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm transition-colors",
          "focus:outline-none focus:ring-2",
          open  && !hasError && "border-primary ring-primary/30",
          hasError
            ? "border-destructive focus:border-destructive focus:ring-destructive/30"
            : "border-border focus:border-primary focus:ring-primary/30",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          display ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="flex-1 text-left">{display || (placeholder ?? "dd/mm/aaaa")}</span>
        <CalendarSVG className="shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5">
          <Calendar
            value={value}
            onChange={v => { onChange(v); if (v) setOpen(false) }}
            min={min}
            max={max}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

export { CalendarSVG as CalendarIcon }
