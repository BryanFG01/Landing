"use client"

import { cn } from "@/shared/lib/utils"
import { ChevronIcon } from "./ChevronIcon"
import { FilterField } from "./FilterField"
import { fieldWidthClass } from "./lib"
import { useDynamicFilter } from "./useDynamicFilter"
import { XSmallIcon } from "./XSmallIcon"
import type { DynamicFilterProps } from './types';

export type {
  DynamicFilterProps,
  FilterConfig,
  FilterOption,
  FilterType,
  FilterValue,
  FilterValues,
} from './types';

export function DynamicFilter({
  filters,
  value = {},
  onChange,
  className,
  defaultExpanded = true,
  title = "Filtros",
}: DynamicFilterProps) {
  const panel = useDynamicFilter(value, onChange, defaultExpanded)

  return (
    <div className={cn("rounded-lg border border-border bg-background", className)}>
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="text-sm font-semibold text-foreground">{title}</span>

        {panel.hasActive && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
            {panel.activeCount}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {panel.hasActive && (
            <button
              type="button"
              onClick={panel.clearAll}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <XSmallIcon />
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={panel.toggleExpanded}
            aria-expanded={panel.expanded}
            aria-label={panel.expanded ? "Ocultar filtros" : "Mostrar filtros"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronIcon open={panel.expanded} />
          </button>
        </div>
      </div>

      {/* ── Fields ── */}
      {panel.expanded && (
        <>
          <div className="border-t border-border" />
          <div className="flex flex-wrap gap-3 p-4">
            {filters.map((filter) => (
              <div
                key={filter.key}
                className={cn("flex flex-col gap-1.5", fieldWidthClass(filter.type))}
              >
                <label className="text-xs font-medium text-muted-foreground leading-none">
                  {filter.label}
                </label>
                <FilterField
                  filter={filter}
                  value={value[filter.key]}
                  onChange={(v) => panel.handleChange(filter.key, v)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
