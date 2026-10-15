"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  circle?: boolean
  lines?: number
}

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
