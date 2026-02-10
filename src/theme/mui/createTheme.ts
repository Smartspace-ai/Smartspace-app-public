/**
 * MUI theme built from design tokens only.
 * No raw hex, px, or inline transitions — all from tokens.
 */

import {
  createTheme as muiCreateTheme,
  type PaletteMode,
} from '@mui/material/styles';

import { breakpointTokens } from '@/theme/tokens/breakpoints';
import { elevationTokens, type ElevationLevel } from '@/theme/tokens/elevation';
import { motionTokens } from '@/theme/tokens/motion';
import { radiusTokens } from '@/theme/tokens/radii';
import { semanticDark } from '@/theme/tokens/semantic.dark';
import type { SemanticDark } from '@/theme/tokens/semantic.dark';
import { semanticLight } from '@/theme/tokens/semantic.light';
import type { SemanticLight } from '@/theme/tokens/semantic.light';
import { typographyTokens } from '@/theme/tokens/typography';
import { zIndexTokens } from '@/theme/tokens/zIndex';

const semantic = (mode: PaletteMode) =>
  mode === 'dark' ? semanticDark : semanticLight;

export function createAppTheme(mode: PaletteMode = 'light') {
  const s = semantic(mode);
  const shadows =
    mode === 'dark' ? elevationTokens.dark : elevationTokens.light;

  return muiCreateTheme({
    palette: {
      mode,
      primary: {
        main: s.action.primary.main,
        light: s.action.primary.hover,
        dark: s.action.primary.active,
        contrastText: s.text.inverse,
      },
      secondary: {
        main: s.action.secondary.main,
        light: s.action.secondary.hover,
        dark: s.action.secondary.active,
        contrastText: s.text.primary,
      },
      error: {
        main: s.action.danger.main,
        light: s.action.danger.hover,
        dark: s.action.danger.active,
        contrastText: s.text.inverse,
      },
      success: {
        main: s.action.success.main,
        light: s.action.success.hover,
        dark: s.action.success.active,
        contrastText: s.text.inverse,
      },
      background: {
        default: s.background.canvas,
        paper: s.background.surface,
      },
      text: {
        primary: s.text.primary,
        secondary: s.text.secondary,
        disabled: s.text.disabled,
      },
      divider: s.border.subtle,
    },
    typography: {
      fontFamily: typographyTokens.fontFamily.sans,
      h1: {
        fontSize: typographyTokens.fontSize.h1,
        fontWeight: typographyTokens.fontWeight.bold,
        lineHeight: typographyTokens.lineHeight.tight,
      },
      h2: {
        fontSize: typographyTokens.fontSize.h2,
        fontWeight: typographyTokens.fontWeight.bold,
        lineHeight: typographyTokens.lineHeight.tight,
      },
      h3: {
        fontSize: typographyTokens.fontSize.h3,
        fontWeight: typographyTokens.fontWeight.semibold,
        lineHeight: typographyTokens.lineHeight.snug,
      },
      h4: {
        fontSize: typographyTokens.fontSize.h4,
        fontWeight: typographyTokens.fontWeight.semibold,
        lineHeight: typographyTokens.lineHeight.snug,
      },
      h5: {
        fontSize: typographyTokens.fontSize.h5,
        fontWeight: typographyTokens.fontWeight.semibold,
        lineHeight: typographyTokens.lineHeight.normal,
      },
      h6: {
        fontSize: typographyTokens.fontSize.h6,
        fontWeight: typographyTokens.fontWeight.semibold,
        lineHeight: typographyTokens.lineHeight.normal,
      },
      body1: {
        fontSize: typographyTokens.fontSize.body,
        lineHeight: typographyTokens.lineHeight.normal,
      },
      body2: {
        fontSize: typographyTokens.fontSize.bodySm,
        lineHeight: typographyTokens.lineHeight.normal,
      },
      caption: {
        fontSize: typographyTokens.fontSize.caption,
        lineHeight: typographyTokens.lineHeight.normal,
      },
      button: {
        textTransform: 'none',
        fontWeight: typographyTokens.fontWeight.medium,
      },
    },
    shape: {
      borderRadius: radiusTokens.md,
    },
    /** 8px grid — use theme.spacing(n) for 8*n px */
    spacing: 8,
    breakpoints: {
      values: breakpointTokens,
    },
    zIndex: zIndexTokens,
    components: getComponentOverrides(mode, shadows, s),
  });
}

function getComponentOverrides(
  _mode: PaletteMode,
  shadows: Record<ElevationLevel, string>,
  s: SemanticLight | SemanticDark
) {
  const transition = (property: string) =>
    `${property} ${motionTokens.duration.normal}ms ${motionTokens.easing.standard}`;

  return {
    MuiButtonBase: {
      defaultProps: {
        disableTouchRipple: true,
      },
      styleOverrides: {
        root: {
          transition:
            transition('background-color') + ', ' + transition('color'),
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radiusTokens.md,
          transition:
            transition('background-color') + ', ' + transition('box-shadow'),
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: radiusTokens.md,
          boxShadow: shadows[1],
          transition: transition('box-shadow'),
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radiusTokens.lg,
          boxShadow: shadows[4],
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          boxShadow: shadows[2],
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: 'inherit',
          letterSpacing: 'inherit',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: 'inherit',
          letterSpacing: 'inherit',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: 'inherit',
          letterSpacing: 'inherit',
          transition: transition('background-color'),
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: transition('background-color'),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          transition: transition('opacity'),
        },
      },
    },
  };
}

/** Default light theme for app (backward compatible). */
export const appTheme = createAppTheme('light');
