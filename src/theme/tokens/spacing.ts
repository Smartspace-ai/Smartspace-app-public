/**
 * Spacing scale — 8px grid. No raw px values in components.
 */

const unit = 8;

export const spacingTokens = {
  0: 0,
  1: unit * 0.25, // 2
  2: unit * 0.5, // 4
  3: unit * 0.75, // 6
  4: unit * 1, // 8
  5: unit * 1.25, // 10
  6: unit * 1.5, // 12
  8: unit * 2, // 16
  10: unit * 2.5, // 20
  12: unit * 3, // 24
  16: unit * 4, // 32
  20: unit * 5, // 40
  24: unit * 6, // 48
  32: unit * 8, // 64
  40: unit * 10, // 80
  48: unit * 12, // 96
  64: unit * 16, // 128
} as const;

export type SpacingScale = keyof typeof spacingTokens;

/** Get spacing in px (for MUI theme). Use theme.spacing() in components. */
export function getSpacing(scale: SpacingScale): number {
  return spacingTokens[scale];
}
