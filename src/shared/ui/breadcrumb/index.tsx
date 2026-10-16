"use client"

import { cn } from "@/shared/lib/utils"
import type { BreadcrumbProps } from './types';

export type { BreadcrumbItem, BreadcrumbProps } from './types';

function DefaultSeparator() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

export function Breadcrumb({ items, separator, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Migas de pan" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-muted-foreground/50 select-none">
                  {separator ?? <DefaultSeparator />}
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    isLast
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
