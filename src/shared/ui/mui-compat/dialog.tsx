import MuiDialog from "@mui/material/Dialog"
import MuiDialogActions from "@mui/material/DialogActions"
import MuiDialogContent from "@mui/material/DialogContent"
import MuiDialogTitle from "@mui/material/DialogTitle"
import IconButton from "@mui/material/IconButton"
import { X } from "lucide-react"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

type DialogCtx = { close: () => void }
const DialogContext = React.createContext<DialogCtx | null>(null)

const Dialog = ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => {
  const close = () => onOpenChange?.(false)
  return (
    <DialogContext.Provider value={{ close }}>
      <MuiDialog
        open={!!open}
        onClose={close}
        maxWidth={false}
        slotProps={{
          backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.8)' } },
        }}
        PaperProps={{
          sx: {
            // Match previous approx width of 425px
            maxWidth: '425px',
            width: '100%',
            bgcolor: 'transparent',
            boxShadow: 'none',
            m: 0,
            p: 0,
          },
        }}
      >
        {children}
      </MuiDialog>
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ children, onClick, asChild }: { children: React.ReactElement; onClick?: React.MouseEventHandler; asChild?: boolean }) =>
  asChild ? React.cloneElement(children, { onClick }) : (
    <button type="button" onClick={onClick} style={{ all: 'unset' }}>
      {children}
    </button>
  )

const DialogPortal = ({ children }: { children: React.ReactNode }) => <span style={{ display: 'contents' }}>{children}</span>

const DialogClose = ({ children, onClick }: { children?: React.ReactNode; onClick?: React.MouseEventHandler }) => (
  <IconButton size="small" onClick={onClick}>{children ?? <X className="h-4 w-4" />}</IconButton>
)

const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
))
DialogOverlay.displayName = "DialogOverlay"

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof MuiDialogContent> {
  hideClose?: boolean;
  onOpenAutoFocus?: (e: any) => void;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, hideClose = false, onOpenAutoFocus, ...props }, ref) => {
    const ctx = React.useContext(DialogContext)
    return (
      <MuiDialogContent
        ref={ref}
        className={cn("grid gap-4 border bg-background p-5 shadow-lg sm:rounded-lg", className)}
        onFocus={onOpenAutoFocus as any}
        {...props}
      >
        {children}
        {!hideClose && (
          <IconButton className="absolute right-4 top-4" size="small" onClick={() => ctx?.close()}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </IconButton>
        )}
      </MuiDialogContent>
    )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <MuiDialogActions className={cn("flex flex-row justify-end space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof MuiDialogTitle>>(
  ({ className, ...props }, ref) => (
    <MuiDialogTitle
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      sx={{ textAlign: 'left', fontWeight: 600, p: 0, m: 0 }}
      {...props}
    />
  )
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
DialogDescription.displayName = "DialogDescription"

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger }

