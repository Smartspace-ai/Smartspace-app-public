/**
 * Semantic tokens for dark mode. Components consume these only (via theme / CSS vars).
 * Built from core color ramps; no raw hex in components.
 */

import { coreColors } from './core.colors';

export const semanticDark = {
  background: {
    canvas: coreColors.gray[950],
    surface: coreColors.gray[900],
    elevated: coreColors.gray[800],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  text: {
    primary: coreColors.gray[50],
    secondary: coreColors.gray[400],
    muted: coreColors.gray[500],
    inverse: coreColors.gray[900],
    disabled: coreColors.gray[600],
  },
  action: {
    primary: {
      main: coreColors.brand[400],
      hover: coreColors.brand[300],
      active: coreColors.brand[200],
      disabled: coreColors.gray[600],
      focus: coreColors.brand[400],
    },
    secondary: {
      main: coreColors.gray[700],
      hover: coreColors.gray[600],
      active: coreColors.gray[500],
      disabled: coreColors.gray[800],
      focus: coreColors.gray[500],
    },
    danger: {
      main: coreColors.danger[400],
      hover: coreColors.danger[300],
      active: coreColors.danger[200],
      disabled: coreColors.gray[600],
      focus: coreColors.danger[400],
    },
    success: {
      main: coreColors.success[400],
      hover: coreColors.success[300],
      active: coreColors.success[200],
      disabled: coreColors.gray[600],
      focus: coreColors.success[400],
    },
  },
  border: {
    subtle: coreColors.gray[800],
    default: coreColors.gray[700],
    strong: coreColors.gray[600],
    focus: coreColors.brand[400],
  },
  state: {
    error: {
      bg: coreColors.danger[900],
      text: coreColors.danger[200],
    },
    success: {
      bg: coreColors.success[900],
      text: coreColors.success[200],
    },
    warning: {
      bg: coreColors.warning[900],
      text: coreColors.warning[200],
    },
    info: {
      bg: coreColors.info[900],
      text: coreColors.info[200],
    },
  },
} as const;

export type SemanticDark = typeof semanticDark;
