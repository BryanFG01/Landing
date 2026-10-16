"use client"

import { cn } from "@/shared/lib/utils"
import type { SkeletonProps } from './types';

export type { SkeletonProps } from './types';

export function Skeleton({ width, height, circle, lines, className, style, ...props }: SkeletonProps) {
  if (lines) {
    return (
      <div className={cn("space-y-2", className)} aria-hidden="true" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded-md bg-muted"
            style={{ width: i === lines - 1 && lines > 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-muted",
        circle && "rounded-full",
        className
      )}
      style={{
        width:  circle ? (width ?? 40) : width,
        height: circle ? (width ?? 40) : (height ?? "1rem"),
        ...style,
      }}
      {...props}
    />
  )
}
