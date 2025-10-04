import MuiSwitch from "@mui/material/Switch"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

type SwitchProps = React.ComponentPropsWithoutRef<typeof MuiSwitch> & {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => (
    <MuiSwitch
      ref={ref as unknown as React.ForwardedRef<HTMLButtonElement>}
      className={cn("inline-flex h-6 w-11", className)}
      disableRipple
      onChange={(e, checked) => {
        onCheckedChange?.(checked)
        onChange?.(e as any, checked)
      }}
      sx={{
        width: 44,
        height: 24,
        padding: 0,
        '& .MuiSwitch-switchBase': {
          padding: 2,
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            color: 'hsl(var(--background))',
            '& + .MuiSwitch-track': {
              backgroundColor: 'hsl(var(--primary))',
              opacity: 1,
            },
          },
        },
        '& .MuiSwitch-thumb': {
          width: 20,
          height: 20,
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          backgroundColor: 'hsl(var(--background))',
        },
        '& .MuiSwitch-track': {
          borderRadius: 9999,
          backgroundColor: 'hsl(var(--input))',
          opacity: 1,
        },
      }}
      {...props}
    />
  )
)
Switch.displayName = "Switch"

export { Switch }

