import LinearProgress from "@mui/material/LinearProgress"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

type ProgressProps = React.ComponentPropsWithoutRef<typeof LinearProgress> & {
  value?: number
}

const Progress = React.forwardRef<HTMLSpanElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <LinearProgress
      ref={ref}
      variant="determinate"
      value={value}
      className={cn("h-4 w-full rounded-full", className)}
      sx={{
        borderRadius: "9999px",
        backgroundColor: "hsl(var(--secondary))",
        '& .MuiLinearProgress-bar': {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: '9999px',
          transition: 'transform 150ms linear',
        },
      }}
      {...props}
    />
  )
)
Progress.displayName = "Progress"

export { Progress }

