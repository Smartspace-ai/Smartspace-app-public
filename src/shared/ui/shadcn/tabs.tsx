import MuiTab from "@mui/material/Tab"
import MuiTabs from "@mui/material/Tabs"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

type TabsProps = React.ComponentPropsWithoutRef<typeof MuiTabs> & {
  defaultValue?: string
  onValueChange?: (value: string) => void
}

const TabsContext = React.createContext<{
  value: string
  setValue: (v: string) => void
} | null>(null)

const Tabs = ({ defaultValue, value: controlledValue, onValueChange, children, ...props }: TabsProps) => {
  const [value, setValue] = React.useState<string>(controlledValue ?? defaultValue ?? '')

  const handleChange = (_e: React.SyntheticEvent, newValue: string) => {
    if (controlledValue === undefined) setValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value: controlledValue ?? value, setValue }}>
      <MuiTabs
        value={controlledValue ?? value}
        onChange={handleChange}
        TabIndicatorProps={{ style: { display: 'none' } }}
        {...props}
      >
        {children}
      </MuiTabs>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props} />
  )
)
TabsList.displayName = "TabsList"

const TabsTrigger = ({ className, value, ...props }: React.ComponentPropsWithoutRef<typeof MuiTab>) => (
  <MuiTab
    value={value}
    disableRipple
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium",
      className
    )}
    sx={{
      textTransform: 'none',
      minHeight: 0,
      padding: '6px 12px',
      '&.Mui-selected': {
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      },
    }}
    {...props}
  />
)

const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext)
    if (!ctx) return null
    const isActive = ctx.value === value
    if (!isActive) return null
    return (
      <div
        ref={ref}
        className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsContent, TabsList, TabsTrigger }

