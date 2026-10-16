"use client"

import { cn } from "@/shared/lib/utils"
import type { PagBtnProps, PaginationProps } from './types';
import { paginationItems } from './lib';

export type { PaginationProps } from './types';

function PagBtn({
  children,
  onClick,
  active,
  disabled,
  "aria-label": ariaLabel,
}: PagBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

export function Pagination({ currentPage, totalPages, onChange, siblingCount = 1, className }: PaginationProps) {
  const pages = paginationItems(currentPage, totalPages, siblingCount)

  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginación" className={cn("flex items-center gap-1", className)}>
      {/* Prev */}
      <PagBtn
        aria-label="Página anterior"
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="15 18 9 12 15 6"/></svg>
      </PagBtn>

      {/* Pages */}
      {pages.map((item) =>
        item.isEllipsis ? (
          <span key={item.key} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground select-none">
            ···
          </span>
        ) : (
          <PagBtn
            key={item.key}
            active={item.page === currentPage}
            onClick={() => onChange(item.page)}
          >
            {item.page}
          </PagBtn>
        )
      )}

      {/* Next */}
      <PagBtn
        aria-label="Página siguiente"
        disabled={currentPage >= totalPages}
        onClick={() => onChange(currentPage + 1)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6"/></svg>
      </PagBtn>
    </nav>
  )
}
