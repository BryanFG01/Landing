"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/shared/lib/utils"
import type { ToastCardProps, ToastProviderProps, ToastVariant } from './types';
import { ToastContext } from './toast.context';
import { useToastCard } from './useToastCard';
import { useToastProvider } from './useToastProvider';

export type { ToastItem, ToastVariant } from './types';
export { useToast } from './useToast';

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

function ToastCard({ title, description, variant = "default", duration = 4000, onDismiss }: ToastCardProps) {
  const { exiting, progress, hasProgress, leave } = useToastCard(duration, onDismiss)

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
      {hasProgress && (
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

export function ToastProvider({ children }: ToastProviderProps) {
  const { toasts, mounted, toast, dismiss } = useToastProvider()

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
