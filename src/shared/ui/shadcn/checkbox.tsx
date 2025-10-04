import MuiCheckbox from "@mui/material/Checkbox"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

type CheckboxProps = React.ComponentPropsWithoutRef<typeof MuiCheckbox>

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <MuiCheckbox
      ref={ref as unknown as React.ForwardedRef<HTMLButtonElement>}
      className={cn("h-4 w-4 p-0", className)}
      disableRipple
      sx={{
        width: 16,
        height: 16,
        padding: 0,
        borderRadius: '2px',
        color: 'hsl(var(--border))',
        '&.Mui-checked': {
          color: 'hsl(var(--primary))',
        },
        '&.Mui-disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
        },
      }}
      {...props}
    />
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

