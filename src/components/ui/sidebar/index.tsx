"use client"

import * as React from "react"
import * as Collapsible from "@radix-ui/react-collapsible"
import { cn } from "../../lib/utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SidebarChildItem {
  label: string
  href: string
  icon?: React.ElementType<{ className?: string; "aria-hidden"?: string }>
}

export interface SidebarItem {
  label: string
  href: string
  icon?: React.ElementType<{ className?: string; "aria-hidden"?: string }>
  badge?: string | number
  children?: SidebarChildItem[]
}

export interface SidebarSection {
  section: string
  items: SidebarItem[]
}

export interface SidebarProps {
  /** Lista plana de items, o agrupada por secciones */
  items?: SidebarItem[]
  sections?: SidebarSection[]
  logo?: React.ReactNode
  footer?: React.ReactNode
  defaultCollapsed?: boolean
  storageKey?: string
  activeHref?: string
  onNavigate?: (href: string) => void
  className?: string
  width?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readStorage(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback
  try {
    const stored = localStorage.getItem(key)
    return stored !== null ? stored === "collapsed" : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, collapsed: boolean): void {
  try {
    localStorage.setItem(key, collapsed ? "collapsed" : "open")
  } catch {}
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({
  item,
  activeHref,
  onNavigate,
  openGroups,
  onToggleGroup,
}: {
  item: SidebarItem
  activeHref?: string
  onNavigate?: (href: string, e: React.MouseEvent<HTMLAnchorElement>) => void
  openGroups: Set<string>
  onToggleGroup: (href: string) => void
}) {
  const isActive = activeHref === item.href
  const hasChildren = !!item.children?.length
  const isOpen = openGroups.has(item.href)
  const Icon = item.icon

  if (hasChildren) {
    return (
      <li>
        <Collapsible.Root open={isOpen} onOpenChange={() => onToggleGroup(item.href)}>
          <Collapsible.Trigger
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm",
              "hover:bg-muted/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive ? "bg-primary/10 font-semibold text-primary" : "font-medium text-muted-foreground"
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            <span className="flex-1 truncate text-left">{item.label}</span>
            {item.badge !== undefined && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {item.badge}
              </span>
            )}
            <ChevronDownIcon open={isOpen} />
          </Collapsible.Trigger>

          <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <ul className="mt-0.5 ml-6 border-l border-border pl-3 py-1 space-y-0.5">
              {item.children!.map((child) => {
                const ChildIcon = child.icon
                const childActive = activeHref === child.href
                return (
                  <li key={child.href}>
                    <a
                      href={child.href}
                      onClick={(e) => onNavigate?.(child.href, e)}
                      aria-current={childActive ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        "hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        childActive ? "font-medium text-primary" : "text-muted-foreground"
                      )}
                    >
                      {ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                      <span className="truncate">{child.label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </Collapsible.Content>
        </Collapsible.Root>
      </li>
    )
  }

  return (
    <li>
      <a
        href={item.href}
        onClick={(e) => onNavigate?.(item.href, e)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
          "hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"
        )}
      >
        {/* Active bar */}
        {isActive && (
          <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-primary" />
        )}
        {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge !== undefined && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {item.badge}
          </span>
        )}
      </a>
    </li>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  items,
  sections,
  logo,
  footer,
  defaultCollapsed = false,
  storageKey = "nuvo-ui-sidebar",
  activeHref,
  onNavigate,
  className,
  width = 240,
}: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(() =>
    readStorage(storageKey, defaultCollapsed)
  )
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(new Set())

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    writeStorage(storageKey, next)
  }

  function toggleGroup(href: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(href) ? next.delete(href) : next.add(href)
      return next
    })
  }

  function handleNavigate(href: string, e: React.MouseEvent<HTMLAnchorElement>) {
    if (onNavigate) {
      e.preventDefault()
      onNavigate(href)
    }
  }

  // Normaliza items planos o secciones en un formato unificado
  const navSections: SidebarSection[] = sections
    ? sections
    : items
    ? [{ section: "", items }]
    : []

  return (
    // Wrapper externo: controla el espacio que ocupa en el layout
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: collapsed ? 0 : width, transition: "width 300ms ease-in-out" }}
    >
      {/* Div de recorte: fija el ancho real del panel */}
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width }}>

        {/* Panel deslizante */}
        <nav
          role="navigation"
          aria-label="Navegación principal"
          className={cn(
            "flex h-full flex-col border-r border-border bg-background",
            "transition-transform duration-300 ease-in-out",
            collapsed ? "-translate-x-full" : "translate-x-0"
          )}
          style={{ width }}
        >
          {/* ── Header con logo y botón colapsar ── */}
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
            <div className="min-w-0 flex-1 overflow-hidden">{logo}</div>
            <button
              onClick={toggleCollapsed}
              aria-label="Colapsar menú"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeftIcon />
            </button>
          </div>

          {/* ── Nav items ── */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            {navSections.map(({ section, items: sectionItems }, idx) => (
              <div
                key={section || idx}
                className={cn("mb-2", idx > 0 && section && "mt-5 border-t border-border/50 pt-4")}
              >
                {section && (
                  <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {section}
                  </p>
                )}
                <ul role="list" className="space-y-0.5">
                  {sectionItems.map((item) => (
                    <NavItem
                      key={item.href}
                      item={item}
                      activeHref={activeHref}
                      onNavigate={handleNavigate}
                      openGroups={openGroups}
                      onToggleGroup={toggleGroup}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Footer ── */}
          {footer && (
            <div className="shrink-0 border-t border-border px-4 py-3">{footer}</div>
          )}
        </nav>
      </div>

      {/* Pestaña expandir — visible solo cuando está colapsado */}
      <button
        onClick={toggleCollapsed}
        aria-label="Expandir menú"
        className={cn(
          "absolute top-16 left-0 z-10",
          "flex h-10 w-5 items-center justify-center",
          "rounded-r-md border border-l-0 border-border bg-background",
          "text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm",
          "transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          collapsed ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}

Sidebar.displayName = "Sidebar"

export { Sidebar }
