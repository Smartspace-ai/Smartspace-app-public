import MuiDialog from "@mui/material/Dialog"
import MuiDialogActions from "@mui/material/DialogActions"
import MuiDialogContent from "@mui/material/DialogContent"
import MuiDialogTitle from "@mui/material/DialogTitle"
import * as React from "react"

import { Button } from "@/shared/ui/shadcn/button"
import { cn } from "@/shared/utils/utils"

const AlertDialog = ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => (
  <MuiDialog open={!!open} onClose={() => onOpenChange?.(false)}>{children}</MuiDialog>
)

const AlertDialogTrigger = ({ children, onClick }: { children: React.ReactElement; onClick?: React.MouseEventHandler }) =>
  React.cloneElement(children, { onClick })

const AlertDialogPortal = ({ children }: { children: React.ReactNode }) => (
  <span style={{ display: 'contents' }}>{children}</span>
)

const AlertDialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
))
AlertDialogOverlay.displayName = "AlertDialogOverlay"

const AlertDialogContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof MuiDialogContent>>(
  ({ className, ...props }, ref) => (
    <MuiDialogContent ref={ref} className={cn("grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg", className)} {...props} />
  )
)
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <MuiDialogActions className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof MuiDialogTitle>>(
  ({ className, ...props }, ref) => (
    <MuiDialogTitle ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
  )
)
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogAction = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Button>>(
  ({ className, ...props }, ref) => (
    <Button ref={ref} className={cn(className)} {...props} />
  )
)
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Button>>(
  ({ className, ...props }, ref) => (
    <Button ref={ref} variant="outline" className={cn("mt-2 sm:mt-0", className)} {...props} />
  )
)
AlertDialogCancel.displayName = "AlertDialogCancel"

export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger }

