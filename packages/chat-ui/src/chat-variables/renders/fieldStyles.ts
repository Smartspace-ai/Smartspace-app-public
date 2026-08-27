/**
 * The design's form vocabulary for variable fields, in one place.
 *
 * Taken from the reference's own primitives rather than invented here: its
 * input, textarea and select trigger are all
 * `h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm`
 * with a `ring-2 ring-ring ring-offset-2` focus ring, its label is
 * `text-sm font-medium`, its select value is clamped to one line so a long
 * option ends in an ellipsis, its composer controls are `h-8 rounded-full`
 * capsules, and its switch is an `h-6 w-11` track with an `h-5 w-5` thumb.
 */

/**
 * Where a field is being rendered. The same variable is a capsule in the
 * composer's action bar, a labelled row in the variables panel, and a
 * full-scale field when it is a question asked in the conversation — and every
 * renderer has to agree on that, or the panel comes out as a jumble of
 * half-width boxes and stray pills.
 */
export type FieldSurface = 'bar' | 'panel' | 'form';

/** `form` is the reference's own scale; the other two sit one step down. */
export type FieldScale = 'dense' | 'comfortable';

export const scaleFor = (surface: FieldSurface): FieldScale =>
  surface === 'form' ? 'comfortable' : 'dense';

/** A label above its control, in the panel and in a conversation form. */
export const fieldLabelClass = (scale: FieldScale) =>
  `block truncate font-medium text-muted-foreground ${
    scale === 'dense' ? 'mb-1 text-xs' : 'mb-1.5 text-sm'
  }`;

const CONTROL_BASE =
  'rounded-md border bg-background text-foreground transition-colors placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const borderClass = (hasError: boolean) =>
  hasError ? 'border-destructive' : 'border-input';

/** A text control: the reference's `px-3 py-2 text-sm`, one step down for dense. */
export const fieldControlClass = (scale: FieldScale, hasError: boolean) =>
  `w-full ${CONTROL_BASE} ${borderClass(hasError)} ${
    scale === 'dense' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
  }`;

/** A control that opens a list: same box, fixed height, value then chevron. */
export const fieldTriggerClass = (scale: FieldScale, hasError: boolean) =>
  `w-full ${CONTROL_BASE} ${borderClass(
    hasError
  )} flex items-center justify-between gap-2 text-left ${
    scale === 'dense' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3 text-sm'
  }`;

/** A short numeric control, sized to its digits rather than the row. */
export const fieldNumberClass = (scale: FieldScale, hasError: boolean) =>
  `${CONTROL_BASE} ${borderClass(hasError)} tabular-nums ${
    scale === 'dense' ? 'h-8 w-20 px-2 text-xs' : 'h-10 w-24 px-2.5 text-sm'
  }`;

export const fieldHintClass = 'mt-1 text-xs text-muted-foreground';
export const fieldErrorClass = 'mt-1 text-xs text-destructive';

/**
 * A settings row: label on the left, control on the right. What a switch or a
 * stepper wants — its control is a fixed size, so a label above it would leave
 * the rest of the row empty.
 */
export const fieldRowClass = 'flex items-center justify-between gap-3';
export const fieldRowLabelClass = (scale: FieldScale) =>
  `min-w-0 flex-1 truncate font-medium text-muted-foreground ${
    scale === 'dense' ? 'text-xs' : 'text-sm'
  }`;

/** The action bar's capsule, worn by every control the design puts in there. */
export const pillClass = (opts: {
  active?: boolean;
  hasError?: boolean;
  disabled?: boolean;
}) =>
  `flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
    opts.active
      ? 'border-primary/30 bg-primary/10 text-primary'
      : 'border-border/70 bg-transparent text-muted-foreground hover:bg-secondary'
  } ${opts.hasError ? 'border-destructive text-destructive' : ''} ${
    opts.disabled ? 'cursor-not-allowed opacity-60' : ''
  }`;

/** A pill's own label and value, both capped so a long name ends in an ellipsis. */
export const pillLabelClass = 'max-w-[9rem] truncate';
export const pillValueClass = 'max-w-[9rem] truncate text-foreground';

/** The reference's switch: an `h-6 w-11` track carrying an `h-5 w-5` thumb. */
export const switchTrackClass = (on: boolean, disabled: boolean) =>
  `peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
    on ? 'bg-primary' : 'bg-input'
  } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`;
export const switchThumbClass = (on: boolean) =>
  `pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
    on ? 'translate-x-5' : 'translate-x-0'
  }`;

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
