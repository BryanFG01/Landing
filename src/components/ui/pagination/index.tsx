"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
  siblingCount?: number
  className?: string
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function usePaginationRange(current: number, total: number, sibling: number): (number | "...")[] {
  if (total <= 7) return range(1, total)

  const leftSiblingIndex  = Math.max(current - sibling, 1)
  const rightSiblingIndex = Math.min(current + sibling, total)

  const showLeftDots  = leftSiblingIndex > 2
  const showRightDots = rightSiblingIndex < total - 1

  if (!showLeftDots && showRightDots) {
    return [...range(1, 3 + sibling * 2), "...", total]
  }
  if (showLeftDots && !showRightDots) {
    return [1, "...", ...range(total - (2 + sibling * 2), total)]
  }
  return [1, "...", ...range(leftSiblingIndex, rightSiblingIndex), "...", total]
}

function PagBtn({
  children,
  onClick,
  active,
  disabled,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  "aria-label"?: string
}) {
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
  const pages = usePaginationRange(currentPage, totalPages, siblingCount)

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
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground select-none">
            ···
          </span>
        ) : (
          <PagBtn
            key={p}
            active={p === currentPage}
            onClick={() => onChange(p as number)}
          >
            {p}
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
