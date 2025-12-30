import InputBase from "@mui/material/InputBase"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <InputBase
        type={type}
        inputRef={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        // Route legacy HTML input props to the input element
        inputProps={props as unknown as Record<string, unknown>}
        slotProps={{
          input: {
            className: cn(
              "w-full bg-transparent p-0 text-base placeholder:text-muted-foreground md:text-sm",
            ),
          },
        }}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

