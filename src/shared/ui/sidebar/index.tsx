"use client"

import { cn } from "@/shared/lib/utils"
import type { SidebarProps } from './types';
import { CHEVRON_LEFT_ICON, CHEVRON_RIGHT_ICON } from './icons';
import { NavItem } from './NavItem';
import { useSidebar } from './useSidebar';

export type { SidebarChildItem, SidebarItem, SidebarProps, SidebarSection } from './types';

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
  const { collapsed, openGroups, navSections, toggleCollapsed, toggleGroup, handleNavigate } = useSidebar({
    items,
    sections,
    onNavigate,
    storageKey,
    defaultCollapsed,
  })

  return (
    // Wrapper externo: controla el espacio que ocupa en el layout
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: collapsed ? 0 : width, transition: "width 300ms ease-in-out" }}
    >
      {/* Div de recorte: fija el ancho real del panel. Plegado no recibe clics: si no, en móvil (donde el menú se
          superpone al contenido) tapaba con un rectángulo invisible los botones de la izquierda de la página. */}
      <div
        className={cn("absolute inset-y-0 left-0 overflow-hidden", collapsed && "pointer-events-none")}
        style={{ width }}
      >

        {/* Panel deslizante. Plegado es inert: sus enlaces no se alcanzan con el tabulador. */}
        <nav
          role="navigation"
          aria-label="Navegación principal"
          inert={collapsed}
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
              {CHEVRON_LEFT_ICON}
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
        {CHEVRON_RIGHT_ICON}
      </button>
    </div>
  )
}

Sidebar.displayName = "Sidebar"

export { Sidebar }
