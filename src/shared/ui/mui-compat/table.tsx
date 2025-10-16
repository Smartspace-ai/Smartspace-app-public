import MuiTable from "@mui/material/Table"
import MuiTableBody from "@mui/material/TableBody"
import MuiTableCell from "@mui/material/TableCell"
import MuiTableContainer from "@mui/material/TableContainer"
import MuiTableHead from "@mui/material/TableHead"
import MuiTableRow from "@mui/material/TableRow"
import * as React from "react"

import { cn } from "@/shared/utils/utils"

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <MuiTableContainer className="relative w-full overflow-auto">
    <MuiTable ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </MuiTableContainer>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<typeof MuiTableHead>>(({ className, ...props }, ref) => (
  <MuiTableHead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<typeof MuiTableBody>>(({ className, ...props }, ref) => (
  <MuiTableBody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <MuiTableRow ref={ref} className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<typeof MuiTableCell>>(({ className, ...props }, ref) => (
  <MuiTableCell component="th" ref={ref} align="left" className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props} />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<typeof MuiTableCell>>(({ className, ...props }, ref) => (
  <MuiTableCell ref={ref} align="left" className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
))
TableCaption.displayName = "TableCaption"

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow }

