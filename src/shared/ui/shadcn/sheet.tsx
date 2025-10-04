import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

const Sheet = ({ children }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => (
  <span style={{ display: 'contents' }}>{children}</span>
)

const SheetTrigger = ({ children, onClick }: { children: React.ReactElement; onClick?: React.MouseEventHandler }) =>
  React.cloneElement(children, { onClick })

const SheetClose = ({ children, onClick }: { children?: React.ReactNode; onClick?: React.MouseEventHandler }) => (
  <IconButton size="small" onClick={onClick}>{children ?? <X className="h-4 w-4" />}</IconButton>
)

const SheetPortal = ({ children }: { children: React.ReactNode }) => (
  <span style={{ display: 'contents' }}>{children}</span>
)

const SheetOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
))
SheetOverlay.displayName = "SheetOverlay"

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-[90vw]",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-[90vw]",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps extends VariantProps<typeof sheetVariants> {
  hideClose?: boolean;
  side?: "left" | "right" | "top" | "bottom";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  onOpenAutoFocus?: (e: any) => void;
}

const SheetContent = React.forwardRef<HTMLDivElement, React.PropsWithChildren<SheetContentProps>>(
  ({ side = "right", className, children, hideClose = false, open, onOpenChange, onOpenAutoFocus, style, ...props }, ref) => (
    <Drawer
      open={!!open}
      onClose={() => onOpenChange?.(false)}
      anchor={side}
      PaperProps={{
        ref,
        className: cn(sheetVariants({ side }), className),
        style,
      }}
      slotProps={{ backdrop: { onAnimationStart: onOpenAutoFocus as any } }}
      {...props}
    >
      {children}
      {!hideClose && (
        <IconButton className="absolute right-1 top-1" size="small">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </IconButton>
      )}
    </Drawer>
  )
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, children, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props}>{children}</h2>
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
SheetDescription.displayName = "SheetDescription"

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger }

