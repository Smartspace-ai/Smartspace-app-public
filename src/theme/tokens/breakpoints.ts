/**
 * Breakpoint values (px). Use via MUI theme.breakpoints or semantic tokens.
 */

export const breakpointTokens = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

export type BreakpointKey = keyof typeof breakpointTokens;
