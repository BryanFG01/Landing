"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative flex gap-3 rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        info:    "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
        success: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
        warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
        error:   "border-destructive/30 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { variant: "info" },
  }
)

function InfoIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }
function SuccessIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
function WarningIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function ErrorIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> }

const ICONS = {
  info:    <InfoIcon />,
  success: <SuccessIcon />,
  warning: <WarningIcon />,
  error:   <ErrorIcon />,
}

export interface AlertProps extends VariantProps<typeof alertVariants> {
  title?: string
  children?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export function Alert({
  variant = "info",
  title,
  children,
  dismissible,
  onDismiss,
  className,
}: AlertProps) {
  const [visible, setVisible] = React.useState(true)

  if (!visible) return null

  function dismiss() {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <div role="alert" className={alertVariants({ variant, className })}>
      <span className="mt-0.5 shrink-0">{ICONS[variant ?? "info"]}</span>

      <div className="min-w-0 flex-1">
        {title && <p className="mb-0.5 font-semibold leading-tight">{title}</p>}
        {children && <div className="leading-relaxed opacity-90">{children}</div>}
      </div>

      {dismissible && (
        <button
          type="button"
          aria-label="Cerrar alerta"
          onClick={dismiss}
          className="mt-0.5 shrink-0 rounded opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-current"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}
