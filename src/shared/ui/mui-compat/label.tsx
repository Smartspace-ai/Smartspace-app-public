import InputLabel from "@mui/material/InputLabel"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

type LabelProps = React.ComponentPropsWithoutRef<typeof InputLabel> &
  VariantProps<typeof labelVariants>

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <InputLabel
    ref={ref}
    disableAnimation
    shrink={false}
    className={cn(labelVariants(), className)}
    sx={{ color: 'hsl(var(--foreground))' }}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }

