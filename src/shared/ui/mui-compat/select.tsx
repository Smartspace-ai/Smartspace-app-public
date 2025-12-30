import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import { ChevronDown } from "lucide-react"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

type SelectContextValue = {
  value?: string
  setValue: (v: string) => void
  open: boolean
  setOpen: (o: boolean) => void
  anchorEl: HTMLElement | null
  setAnchorEl: (el: HTMLElement | null) => void
  setSelectedLabel: (label: string) => void
  selectedLabel?: string
}

const SelectCtx = React.createContext<SelectContextValue | null>(null)

const Select = ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children?: React.ReactNode }) => {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(value)
  const [open, setOpen] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const [selectedLabel, setSelectedLabel] = React.useState<string | undefined>(undefined)

  const setValue = (v: string) => {
    if (value === undefined) setInternalValue(v)
    onValueChange?.(v)
  }

  return (
    <SelectCtx.Provider value={{ value: value ?? internalValue, setValue, open, setOpen, anchorEl, setAnchorEl, setSelectedLabel, selectedLabel }}>
      {children}
    </SelectCtx.Provider>
  )
}

const SelectGroup = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const ctx = React.useContext<SelectContextValue | null>(SelectCtx)
  if (!ctx) return null
  return <span className="truncate">{ctx.selectedLabel ?? placeholder}</span>
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, ...props }, ref) => {
  const ctx = React.useContext<SelectContextValue | null>(SelectCtx)
  if (!ctx) return (
    <button ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm", className)} {...props}>
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    ctx.setAnchorEl(e.currentTarget)
    ctx.setOpen(!ctx.open)
    props.onClick?.(e)
  }

  return (
    <button
      ref={ref}
      className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode }>(( { className, children }, ref) => {
  const ctx = React.useContext<SelectContextValue | null>(SelectCtx)
  if (!ctx) return null
  return (
    <Menu
      open={ctx.open}
      anchorEl={ctx.anchorEl}
      onClose={() => ctx.setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
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
})
SelectContent.displayName = "SelectContent"

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
))
SelectLabel.displayName = "SelectLabel"

const SelectItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<typeof MenuItem> & { value: string }>(
  ({ className, children, value, ...props }, ref) => {
    const ctx = React.useContext<SelectContextValue | null>(SelectCtx)
    const label = typeof children === 'string' ? children : (Array.isArray(children) ? children.join(' ') : String(children))
    React.useEffect(() => {
      if (!ctx) return
      if (ctx.value === value) ctx.setSelectedLabel(label)
    }, [ctx, value, label])

    const handleClick = (e: React.MouseEvent<HTMLLIElement>) => {
      ctx?.setValue(value)
      ctx?.setSelectedLabel(label)
      ctx?.setOpen(false)
      props.onClick?.(e)
    }
    return (
      <MenuItem ref={ref} className={cn("relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm", className)} onClick={handleClick} {...props}>
        {children}
      </MenuItem>
    )
  }
)
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
))
SelectSeparator.displayName = "SelectSeparator"

const SelectScrollUpButton = () => null
const SelectScrollDownButton = () => null

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue }

