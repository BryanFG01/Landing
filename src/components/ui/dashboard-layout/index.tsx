"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardLayoutProps {
  header?:      React.ReactNode
  sidebar?:     React.ReactNode
  footer?:      React.ReactNode
  children:     React.ReactNode
  sidebarWidth?:string
  headerHeight?: string
  footerHeight?: string
  className?:   string
}

// ─── DashboardLayout ──────────────────────────────────────────────────────────

export function DashboardLayout({
  header,
  sidebar,
  footer,
  children,
  sidebarWidth  = "240px",
  headerHeight  = "56px",
  footerHeight  = "48px",
  className,
}: DashboardLayoutProps) {
  return (
    // h-full: respeta el tamaño del contenedor padre.
    // Para uso full-page envuelve en <div className="h-screen">.
    <div className={cn("flex h-full overflow-hidden bg-background text-foreground", className)}>

      {/* ── Sidebar — flex normal, sin fixed ──────────────────────────── */}
      {sidebar && (
        <aside
          className="flex shrink-0 flex-col border-r border-border bg-background overflow-y-auto"
          style={{ width: sidebarWidth }}
        >
          {sidebar}
        </aside>
      )}

      {/* ── Right column ───────────────────────────────────────────────── */}
      {/* min-w-0: sin esto, una tabla ancha estira la columna más allá de la pantalla en lugar de hacer scroll. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">

        {/* Header */}
        {header && (
          <header
            className="flex shrink-0 items-center border-b border-border bg-background/80 backdrop-blur-sm px-4"
            style={{ height: headerHeight }}
          >
            {header}
          </header>
        )}

        {/* Main scrollable. relative: lo absoluto de dentro (p. ej. inputs sr-only) se queda en este scroll y no
            alarga la página (si no, se desplaza todo el panel, menú lateral incluido). */}
        <main className="relative flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        {footer && (
          <footer
            className="flex shrink-0 items-center border-t border-border bg-background px-4 text-xs text-muted-foreground"
            style={{ height: footerHeight }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

// ─── DashboardHeader ─────────────────────────────────────────────────────────

export interface DashboardHeaderProps {
  left?:     React.ReactNode
  right?:    React.ReactNode
  center?:   React.ReactNode
  className?:string
}

export function DashboardHeader({ left, center, right, className }: DashboardHeaderProps) {
  return (
    <div className={cn("flex w-full items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3 min-w-0">{left}</div>
      {center && <div className="flex-1 flex justify-center">{center}</div>}
      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </div>
  )
}

// ─── DashboardSidebar ─────────────────────────────────────────────────────────

export interface DashboardSidebarProps {
  header?:   React.ReactNode
  footer?:   React.ReactNode
  children:  React.ReactNode
  className?:string
}

export function DashboardSidebar({ header, footer, children, className }: DashboardSidebarProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      {header && (
        <div className="shrink-0 border-b border-border px-4 py-3">{header}</div>
      )}
      <nav className="flex-1 overflow-y-auto py-3 px-2">{children}</nav>
      {footer && (
        <div className="shrink-0 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  )
}

// ─── DashboardNav ─────────────────────────────────────────────────────────────

export interface DashboardNavItem {
  label:   string
  icon?:   React.ReactNode
  active?: boolean
  badge?:  string | number
  onClick?:() => void
}

export function DashboardNav({ items }: { items: DashboardNavItem[] }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={item.onClick}
            className={cn(
              "relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              item.active
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {item.active && (
              <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-primary" />
            )}
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span className="flex-1 truncate text-left">{item.label}</span>
            {item.badge !== undefined && (
              <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {item.badge}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
