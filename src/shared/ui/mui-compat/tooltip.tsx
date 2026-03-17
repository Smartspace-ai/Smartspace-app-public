import MuiTooltip from "@mui/material/Tooltip";
import * as React from "react";

import { cn } from "@/shared/utils/utils";

const TooltipProvider = ({ children, delayDuration }: { children: React.ReactNode; delayDuration?: number }) => {
  // MUI Tooltip manages delay via `enterDelay` on each tooltip; we keep Provider for API parity
  return <span style={{ display: 'contents' }} data-delay={delayDuration}>{children}</span>
}

type TooltipRootProps = React.ComponentPropsWithoutRef<typeof MuiTooltip>

const Tooltip = ({ children, title, ...props }: TooltipRootProps) => {
  return (
    <MuiTooltip
      title={title as React.ReactNode}
      slotProps={{
        tooltip: {
          className: cn(
            "z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
          ),
        },
      }}
      {...props}
    >
      {/* MUI expects a single child element */}
      {children as React.ReactElement}
    </MuiTooltip>
  )
}

const TooltipTrigger = ({ children }: { children: React.ReactElement }) => children

const TooltipContent = React.forwardRef<HTMLDivElement, { className?: string }>(
  // No-op: content is driven via `title` prop in our wrapper above; we keep this for API parity
  function TooltipContent(_props, _ref) {
    return null
  }
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

