import MuiPopover from "@mui/material/Popover"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

type OpenChangeHandler = (open: boolean) => void

type PopoverContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  anchorEl: HTMLElement | null
  setAnchorEl: (el: HTMLElement | null) => void
  onOpenChange?: OpenChangeHandler
}

const PopoverCtx = React.createContext<PopoverContextValue | null>(null)

type PopoverProps = {
  open?: boolean
  onOpenChange?: OpenChangeHandler
  children: React.ReactNode
}

const Popover = ({ open: openProp, onOpenChange, children }: PopoverProps) => {
  const [openState, setOpenState] = React.useState<boolean>(Boolean(openProp))
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)

  const open = openProp !== undefined ? openProp : openState

  const setOpen = React.useCallback((next: boolean) => {
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }, [openProp, onOpenChange])

  const value = React.useMemo<PopoverContextValue>(
    () => ({ open, setOpen, anchorEl, setAnchorEl, onOpenChange }),
    [open, setOpen, anchorEl, onOpenChange]
  )

  return <PopoverCtx.Provider value={value}>{children}</PopoverCtx.Provider>
}

type TriggerProps = React.HTMLAttributes<HTMLElement> & {
  asChild?: boolean
  children: React.ReactElement
}

const PopoverTrigger = React.forwardRef<unknown, TriggerProps>(
  ({ asChild = false, children, ...props }, ref) => {
    const ctx = React.useContext(PopoverCtx)
    if (!ctx) return children

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      ctx.setAnchorEl(e.currentTarget as HTMLElement)
      ctx.setOpen(!ctx.open)
      props.onClick?.(e)
    }

    const child = React.cloneElement(children, {
      ref,
      onClick: handleClick,
      ...props,
    })

    return asChild ? child : <span>{child}</span>
  }
)

type ContentProps = Omit<React.ComponentPropsWithoutRef<typeof MuiPopover>, 'open' | 'anchorEl' | 'onClose'> & {
  className?: string
}

const PopoverContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, slotProps, anchorOrigin, transformOrigin, ...props }, ref) => {
    const ctx = React.useContext(PopoverCtx)
    if (!ctx) return null

    const wantsFullWidth = typeof className === 'string' && className.split(/\s+/).includes('w-full')
    const anchorWidth = ctx.anchorEl?.getBoundingClientRect().width

    return (
      <MuiPopover
        open={ctx.open}
        anchorEl={ctx.anchorEl}
        onClose={() => ctx.setOpen(false)}
        anchorOrigin={anchorOrigin ?? { vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={transformOrigin ?? { vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            className: cn(
              "z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
              className
            ),
            ref,
            style: wantsFullWidth && anchorWidth ? { width: anchorWidth } : undefined,
          },
          ...slotProps,
        }}
        {...props}
      />
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverContent, PopoverTrigger }

