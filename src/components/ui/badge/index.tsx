import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../../lib/utils'

// ─── Variantes ────────────────────────────────────────────────────────────────
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        success:
          'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400',
        warning:
          'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400',
        error: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400',
        info: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400',
        muted: 'bg-muted text-muted-foreground'
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

const dotColors: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  muted: 'bg-muted-foreground'
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean
}

// ─── Componente ───────────────────────────────────────────────────────────────
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size, dot = false, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant ?? 'default'])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
