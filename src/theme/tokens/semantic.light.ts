/**
 * Semantic tokens for light mode. Components consume these only (via theme / CSS vars).
 * Built from core color ramps; no raw hex in components.
 */

import { coreColors } from './core.colors';

export const semanticLight = {
  background: {
    canvas: coreColors.gray[0],
    surface: coreColors.gray[50],
    elevated: coreColors.gray[0],
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: coreColors.gray[900],
    secondary: coreColors.gray[600],
    muted: coreColors.gray[500],
    inverse: coreColors.gray[0],
    disabled: coreColors.gray[400],
  },
  action: {
    primary: {
      main: coreColors.brand[500],
      hover: coreColors.brand[600],
      active: coreColors.brand[700],
      disabled: coreColors.gray[300],
      focus: coreColors.brand[500],
    },
    secondary: {
      main: coreColors.gray[200],
      hover: coreColors.gray[300],
      active: coreColors.gray[400],
      disabled: coreColors.gray[100],
      focus: coreColors.gray[400],
    },
    danger: {
      main: coreColors.danger[500],
      hover: coreColors.danger[600],
      active: coreColors.danger[700],
      disabled: coreColors.gray[300],
      focus: coreColors.danger[500],
    },
    success: {
      main: coreColors.success[500],
      hover: coreColors.success[600],
      active: coreColors.success[700],
      disabled: coreColors.gray[300],
      focus: coreColors.success[500],
    },
  },
  border: {
    subtle: coreColors.gray[200],
    default: coreColors.gray[300],
    strong: coreColors.gray[400],
    focus: coreColors.brand[500],
  },
  state: {
    error: {
      bg: coreColors.danger[50],
      text: coreColors.danger[700],
    },
    success: {
      bg: coreColors.success[50],
      text: coreColors.success[700],
    },
    warning: {
      bg: coreColors.warning[50],
      text: coreColors.warning[700],
    },
    info: {
      bg: coreColors.info[50],
      text: coreColors.info[700],
    },
  },
} as const;

export type SemanticLight = typeof semanticLight;
