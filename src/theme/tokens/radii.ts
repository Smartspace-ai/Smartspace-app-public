/**
 * Border radius tokens. No hardcoded border-radius in components.
 */

export const radiusTokens = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export type RadiusScale = keyof typeof radiusTokens;
