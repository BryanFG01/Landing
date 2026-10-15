"use client"

import * as RadixTabs from "@radix-ui/react-tabs"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

// ─── TabsList ─────────────────────────────────────────────────────────────────

const tabsListVariants = cva("inline-flex items-center", {
  variants: {
    variant: {
      line: "gap-1 border-b border-border",
      pill: "gap-1 rounded-lg bg-muted p-1",
    },
  },
  defaultVariants: { variant: "line" },
})

const tabsTriggerVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        line: [
          "rounded-t-md text-muted-foreground hover:text-foreground",
          "border-b-2 border-transparent -mb-px",
          "data-[state=active]:border-primary data-[state=active]:text-foreground",
        ],
        pill: [
          "rounded-md text-muted-foreground hover:text-foreground",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        ],
      },
    },
    defaultVariants: { variant: "line" },
  }
)

// ─── Context ──────────────────────────────────────────────────────────────────

const TabsVariantContext = React.createContext<"line" | "pill">("line")

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export interface TabsProps extends VariantProps<typeof tabsListVariants> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

export function Tabs({ defaultValue, value, onValueChange, variant = "line", className, children }: TabsProps) {
  return (
    <TabsVariantContext.Provider value={variant ?? "line"}>
      <RadixTabs.Root
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        className={className}
      >
        {children}
      </RadixTabs.Root>
    </TabsVariantContext.Provider>
  )
}

// ─── TabsList ─────────────────────────────────────────────────────────────────

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  const variant = React.useContext(TabsVariantContext)
  return (
    <RadixTabs.List className={cn(tabsListVariants({ variant }), className)}>
      {children}
    </RadixTabs.List>
  )
}

// ─── TabsTrigger ──────────────────────────────────────────────────────────────

export interface TabsTriggerProps {
  value: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function TabsTrigger({ value, disabled, className, children }: TabsTriggerProps) {
  const variant = React.useContext(TabsVariantContext)
  return (
    <RadixTabs.Trigger
      value={value}
      disabled={disabled}
      className={cn(tabsTriggerVariants({ variant }), className)}
    >
      {children}
    </RadixTabs.Trigger>
  )
}

// ─── TabsContent ──────────────────────────────────────────────────────────────

export interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  return (
    <RadixTabs.Content
      value={value}
      className={cn("mt-4 focus-visible:outline-none", className)}
    >
      {children}
    </RadixTabs.Content>
  )
}
