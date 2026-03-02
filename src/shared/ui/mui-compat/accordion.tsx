import MuiAccordion from "@mui/material/Accordion"
import MuiAccordionDetails from "@mui/material/AccordionDetails"
import MuiAccordionSummary from "@mui/material/AccordionSummary"
import { ChevronDown } from "lucide-react"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

const Accordion = MuiAccordion

const AccordionItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof MuiAccordion>>(
  ({ className, ...props }, ref) => (
    <MuiAccordion ref={ref} className={cn("border-b", className)} elevation={0} disableGutters {...props} />
  )
)
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof MuiAccordionSummary>>(
  ({ className, children, ...props }, ref) => (
    <MuiAccordionSummary
      ref={ref}
      expandIcon={<ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />}
      className={cn("flex-1 py-4 font-medium", className)}
      {...props}
    >
      {children}
    </MuiAccordionSummary>
  )
)
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof MuiAccordionDetails>>(
  ({ className, children, ...props }, ref) => (
    <MuiAccordionDetails ref={ref} className={cn("text-sm pb-4 pt-0", className)} {...props}>
      {children}
    </MuiAccordionDetails>
  )
)

AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }

