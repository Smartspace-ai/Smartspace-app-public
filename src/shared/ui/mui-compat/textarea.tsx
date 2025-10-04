import InputBase from "@mui/material/InputBase"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <InputBase
        inputRef={ref}
        multiline
        minRows={4}
        // Root carries the visual container styles (border, bg, padding)
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        inputProps={props as unknown as Record<string, unknown>}
        slotProps={{
          input: {
            className: cn(
              "w-full bg-transparent p-0 text-sm placeholder:text-muted-foreground",
            ),
          },
        }}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

