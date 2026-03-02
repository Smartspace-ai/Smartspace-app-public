import MuiSkeleton from "@mui/material/Skeleton"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

type LegacyDivProps = React.HTMLAttributes<HTMLDivElement>

function Skeleton({ className, ...props }: LegacyDivProps) {
  return (
    <MuiSkeleton
      variant="rectangular"
      animation="pulse"
      className={cn("rounded-md bg-muted", className)}
      sx={{ backgroundColor: "hsl(var(--muted))" }}
      component="div"
      // Spread legacy div props for compatibility
      {...(props as unknown as Record<string, unknown>)}
    />
  )
}

export { Skeleton }

