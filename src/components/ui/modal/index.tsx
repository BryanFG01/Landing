import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { cn } from "../../lib/utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl"
}

export type ModalFooterProps = React.HTMLAttributes<HTMLDivElement>

// ─── Anchuras máximas ─────────────────────────────────────────────────────────
const maxWidths = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

// ─── Modal.Footer ─────────────────────────────────────────────────────────────
function ModalFooter({ className, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}
ModalFooter.displayName = "Modal.Footer"

// ─── Modal ────────────────────────────────────────────────────────────────────
function ModalRoot({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxWidth = "md",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 p-4",
            maxWidths[maxWidth],
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
        >
          <div
            className={cn(
              "relative rounded-xl border border-border bg-background p-6 shadow-xl",
              className
            )}
          >
            {title && (
              <Dialog.Title className="pr-8 text-lg font-semibold text-foreground">
                {title}
              </Dialog.Title>
            )}
            {description && (
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            )}

            <div className={cn(title || description ? "mt-4" : "")}>{children}</div>

            <Dialog.Close
              className={cn(
                "absolute right-4 top-4 rounded-md p-1",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "transition-colors"
              )}
              aria-label="Cerrar modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
ModalRoot.displayName = "Modal"

// ─── Export con compound component ────────────────────────────────────────────
const Modal = Object.assign(ModalRoot, { Footer: ModalFooter })

export { Modal, ModalFooter }
