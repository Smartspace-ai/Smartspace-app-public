/**
 * The design's form-field vocabulary, in one place.
 *
 * Taken from the reference's own primitives rather than invented here: its
 * input, textarea and select trigger are all
 * `h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm`
 * with a `ring-2 ring-ring ring-offset-2` focus ring, its label is
 * `text-sm font-medium`, and its select value is clamped to one line so a long
 * option ends in an ellipsis instead of being sliced mid-word.
 *
 * The variable renderers used to carry their own inline palette and metrics,
 * which is why they read as foreign controls wherever they appeared.
 */
export type FieldScale = 'dense' | 'comfortable';

/**
 * `comfortable` is the reference's own scale, for a field being written into.
 * `dense` is the same design one step down, for the variables list — where a
 * stack of full-scale fields turned into a column of blocks.
 */
export const fieldLabelClass = (scale: FieldScale) =>
  `block truncate font-medium text-muted-foreground ${
    scale === 'dense' ? 'mb-1 text-xs' : 'mb-1.5 text-sm'
  }`;

const CONTROL_BASE =
  'w-full rounded-md border bg-background text-foreground transition-colors placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const borderClass = (hasError: boolean) =>
  hasError ? 'border-destructive' : 'border-input';

/** A text control: the reference's `px-3 py-2 text-sm`, one step down for dense. */
export const fieldControlClass = (scale: FieldScale, hasError: boolean) =>
  `${CONTROL_BASE} ${borderClass(hasError)} ${
    scale === 'dense' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
  }`;

/** A control that opens a list: same box, fixed height, value then chevron. */
export const fieldTriggerClass = (scale: FieldScale, hasError: boolean) =>
  `${CONTROL_BASE} ${borderClass(
    hasError
  )} flex items-center justify-between gap-2 text-left ${
    scale === 'dense' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3 text-sm'
  }`;

export const fieldHintClass = 'mt-1 text-xs text-muted-foreground';
export const fieldErrorClass = 'mt-1 text-xs text-destructive';

/** The reference's popover: `w-72 max-h-72 bg-popover rounded-xl shadow-lg`. */
export const POPOVER_WIDTH_PX = 288;
export const POPOVER_MAX_HEIGHT_PX = 288;
export const popoverClass =
  'flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-lg';
/** Its list rows, and the small heading above them. */
export const popoverRowClass =
  'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-secondary/60';
export const popoverHeadingClass =
  'text-[10px] font-semibold uppercase tracking-wide text-muted-foreground';
