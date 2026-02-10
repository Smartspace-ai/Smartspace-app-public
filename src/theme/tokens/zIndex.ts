/**
 * Z-index scale. Use these tokens instead of raw numbers.
 */

export const zIndexTokens = {
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  tooltip: 1500,
  toast: 1600,
} as const;

export type ZIndexKey = keyof typeof zIndexTokens;
