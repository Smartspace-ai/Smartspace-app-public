import Divider from "@mui/material/Divider"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

type SeparatorProps = React.ComponentPropsWithoutRef<typeof Divider> & {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
    return (
      <Divider
        ref={ref}
        role={decorative ? "none" : "separator"}
        orientation={orientation}
        // Keep exact sizing with Tailwind utilities
        className={cn(
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        // Ensure colors match tokens precisely
        sx={{
          borderColor: "hsl(var(--border))",
          backgroundColor: "hsl(var(--border))",
          // Remove default margins to match current impl
          my: 0,
        }}
        {...props}
      />
    )
  }
)
Separator.displayName = "Separator"

export { Separator }

