"use client"

import * as RadixDropdown from "@radix-ui/react-dropdown-menu"
import * as React from "react"
import { cn } from "../../lib/utils"

// ─── DropdownMenu ─────────────────────────────────────────────────────────────

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <RadixDropdown.Root>{children}</RadixDropdown.Root>
}

// ─── DropdownTrigger ──────────────────────────────────────────────────────────

export function DropdownTrigger({ children }: { children: React.ReactNode }) {
  return <RadixDropdown.Trigger asChild>{children}</RadixDropdown.Trigger>
}

// ─── DropdownContent ──────────────────────────────────────────────────────────

export interface DropdownContentProps {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  className?: string
}

export function DropdownContent({ children, align = "start", side = "bottom", sideOffset = 4, className }: DropdownContentProps) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-background p-1 shadow-xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  )
}

// ─── DropdownItem ─────────────────────────────────────────────────────────────

export interface DropdownItemProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  destructive?: boolean
  icon?: React.ReactNode
  shortcut?: string
  className?: string
}

export function DropdownItem({ children, onClick, disabled, destructive, icon, shortcut, className }: DropdownItemProps) {
  return (
    <RadixDropdown.Item
      disabled={disabled}
      onSelect={onClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors",
        "focus:bg-muted",
        destructive
          ? "text-destructive focus:bg-destructive/10 focus:text-destructive"
          : "text-foreground",
        disabled && "pointer-events-none opacity-40",
        className
      )}
    >
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="ml-auto text-xs text-muted-foreground">{shortcut}</span>
      )}
    </RadixDropdown.Item>
  )
}

// ─── DropdownSeparator ────────────────────────────────────────────────────────

export function DropdownSeparator({ className }: { className?: string }) {
  return <RadixDropdown.Separator className={cn("my-1 h-px bg-border", className)} />
}

// ─── DropdownLabel ────────────────────────────────────────────────────────────

export function DropdownLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixDropdown.Label className={cn("px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground", className)}>
      {children}
    </RadixDropdown.Label>
  )
}
