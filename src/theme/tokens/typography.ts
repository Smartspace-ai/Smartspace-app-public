/**
 * Typography tokens. All font sizes in rem; use clamp() for fluid scaling.
 * Components consume these via theme.typography, not raw values.
 */

const rem = (px: number) => `${px / 16}rem`;

/** Fluid clamp: min rem, preferred (vw-based), max rem */
const fluid = (minPx: number, preferredPx: number, maxPx: number) =>
  `clamp(${rem(minPx)}, ${(preferredPx / 16).toFixed(3)}rem + ${(
    (preferredPx - minPx) /
    100
  ).toFixed(2)}vw, ${rem(maxPx)})`;

export const typographyTokens = {
  fontFamily: {
    sans: 'inherit',
    mono: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace',
  },
  fontSize: {
    display: fluid(36, 48, 60),
    h1: fluid(28, 36, 44),
    h2: fluid(24, 30, 36),
    h3: fluid(20, 24, 28),
    h4: fluid(18, 20, 24),
    h5: fluid(16, 18, 20),
    h6: fluid(14, 16, 18),
    bodyLg: rem(18),
    body: rem(16),
    bodySm: rem(14),
    caption: rem(12),
    mono: rem(14),
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
} as const;

export type TypographyTokens = typeof typographyTokens;
