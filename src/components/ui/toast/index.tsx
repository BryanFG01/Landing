"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "../../lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "default" | "success" | "warning" | "error"

export interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => string
  dismiss: (id: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = React.createContext<ToastContextValue | null>(null)

// ─── Variant styles ───────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: "border-border bg-background text-foreground",
  success: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  error:   "border-destructive/30 bg-destructive/10 text-destructive",
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SuccessIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
function WarningIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function ErrorIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> }
function CloseIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }

const ICONS: Partial<Record<ToastVariant, React.ReactNode>> = {
  success: <SuccessIcon />,
  warning: <WarningIcon />,
  error:   <ErrorIcon />,
}

// ─── Single toast ─────────────────────────────────────────────────────────────

function ToastCard({ id, title, description, variant = "default", duration = 4000, onDismiss }: ToastItem & { onDismiss: () => void }) {
  const [exiting, setExiting] = React.useState(false)
  const [progress, setProgress] = React.useState(100)

  function leave() {
    setExiting(true)
    setTimeout(onDismiss, 300)
  }

  React.useEffect(() => {
    if (duration <= 0) return
    const start = Date.now()
    const tick = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(pct)
      if (pct === 0) { clearInterval(tick); leave() }
    }, 50)
    return () => clearInterval(tick)
  }, [])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-sm",
        "transition-all duration-300",
        exiting ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100",
        VARIANT_STYLES[variant]
      )}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full bg-current opacity-40 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Icon */}
      {ICONS[variant] && (
        <span className="mt-0.5 shrink-0">{ICONS[variant]}</span>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold leading-tight">{title}</p>}
        {description && <p className={cn("text-xs", title ? "mt-0.5 opacity-80" : "")}>{description}</p>}
      </div>

      {/* Close */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={leave}
        className="mt-0.5 shrink-0 rounded opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-current"
      >
        <CloseIcon />
      </button>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts,  setToasts]  = React.useState<ToastItem[]>([])
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  function toast(item: Omit<ToastItem, "id">): string {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...item, id }])
    return id
  }

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {mounted && createPortal(
        <div
          aria-label="Notificaciones"
          className="fixed bottom-4 right-4 z-[200] flex w-80 max-w-[calc(100vw-2rem)] flex-col-reverse gap-2"
        >
          {toasts.map(t => (
            <ToastCard key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>")
  return ctx
}
