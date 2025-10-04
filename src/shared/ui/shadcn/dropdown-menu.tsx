import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

const DropdownMenuContext = React.createContext<{
  anchorEl: HTMLElement | null
  setAnchorEl: (el: HTMLElement | null) => void
  open: boolean
  setOpen: (o: boolean) => void
} | null>(null)

const DropdownMenu = ({ open: openProp, onOpenChange, children }: { open?: boolean; onOpenChange?: (o: boolean) => void; children: React.ReactNode }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const [openState, setOpenState] = React.useState(Boolean(openProp))
  const open = openProp !== undefined ? openProp : openState
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setOpenState(o)
    onOpenChange?.(o)
  }
  return (
    <DropdownMenuContext.Provider value={{ anchorEl, setAnchorEl, open, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = ({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) => {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) return children
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    ctx.setAnchorEl(e.currentTarget as HTMLElement)
    ctx.setOpen(!ctx.open)
  }
  const child = React.cloneElement(children, { onClick: handleClick })
  return asChild ? child : <span>{child}</span>
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, { className?: string; align?: 'start' | 'end'; children?: React.ReactNode }>(
  ({ className, align = 'start', children }, ref) => {
    const ctx = React.useContext(DropdownMenuContext)
    if (!ctx) return null
    return (
      <Menu
        open={ctx.open}
        anchorEl={ctx.anchorEl}
        onClose={() => ctx.setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: align === 'end' ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: align === 'end' ? 'right' : 'left' }}
        slotProps={{
          paper: {
            ref,
            className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className),
          },
        }}
      >
        {children}
      </Menu>
    )
  }
)

const DropdownMenuItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<typeof MenuItem> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <MenuItem
      ref={ref}
      className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors", inset && "pl-8", className)}
      {...props}
    />
  )
)

const DropdownMenuSeparator = React.forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>(({ className, ...props }, ref) => (
  <hr ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
))

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />
  )
)

const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <span style={{ display: 'contents' }}>{children}</span>
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg", className)} {...props} />
))
const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <div ref={ref} className={cn("flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none", inset && "pl-8", className)} {...props} />
  )
)
const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuRadioItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none", className)} {...props} />
))
const DropdownMenuCheckboxItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none", className)} {...props} />
))

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
)

export {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuShortcut, DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger
}

