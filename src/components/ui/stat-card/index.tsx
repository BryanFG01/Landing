import * as React from "react"
import { cn, formatNumber } from "../../lib/utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type StatTrend = "up" | "down" | "neutral"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  trend?: StatTrend
  icon?: React.ElementType<{ className?: string; "aria-hidden"?: string }>
  formatValue?: boolean
}

// ─── Configuración de trend ───────────────────────────────────────────────────
const trendConfig: Record<StatTrend, { icon: string; color: string }> = {
  up:      { icon: "↑", color: "text-emerald-600 dark:text-emerald-400" },
  down:    { icon: "↓", color: "text-red-500 dark:text-red-400" },
  neutral: { icon: "→", color: "text-muted-foreground" },
}

// ─── Componente ───────────────────────────────────────────────────────────────
const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      title,
      value,
      change,
      changeLabel,
      trend = "neutral",
      icon: Icon,
      formatValue = true,
      ...props
    },
    ref
  ) => {
    const displayValue =
      typeof value === "number" && formatValue ? formatNumber(value) : String(value)

    const { icon: trendArrow, color: trendColor } = trendConfig[trend]

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-border bg-background p-6 shadow-sm",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="mt-3">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {displayValue}
          </span>
        </div>

        {(change !== undefined || changeLabel) && (
          <div className="mt-2 flex items-center gap-1.5 text-sm">
            {change !== undefined && (
              <span className={cn("flex items-center gap-0.5 font-semibold", trendColor)}>
                <span aria-hidden="true">{trendArrow}</span>
                <span>
                  {Math.abs(change)}%
                  <span className="sr-only">
                    {trend === "up" ? " incremento" : trend === "down" ? " disminución" : ""}
                  </span>
                </span>
              </span>
            )}
            {changeLabel && (
              <span className="text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
