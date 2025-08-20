import { createTheme, ThemeOptions } from '@mui/material/styles';
import { palette } from './tokens';

// Create MUI theme based on design tokens
export const createMuiTheme = (options?: ThemeOptions) => {
  const baseTheme: ThemeOptions = {
    palette: {
      mode: 'light',
      primary: {
        main: palette.primary.main,
        light: palette.primary.light,
        dark: palette.primary.dark,
        contrastText: palette.primary.contrastText,
      },
      secondary: {
        main: palette.secondary.main,
        light: palette.secondary.light,
        dark: palette.secondary.dark,
        contrastText: palette.secondary.contrastText,
      },
      error: {
        main: palette.error.main,
        light: palette.error.light,
        dark: palette.error.dark,
        contrastText: palette.error.contrastText,
      },
      warning: {
        main: palette.warning.main,
        light: palette.warning.light,
        dark: palette.warning.dark,
        contrastText: palette.warning.contrastText,
      },
      info: {
        main: palette.info.main,
        light: palette.info.light,
        dark: palette.info.dark,
        contrastText: palette.info.contrastText,
      },
      success: {
        main: palette.success.main,
        light: palette.success.light,
        dark: palette.success.dark,
        contrastText: palette.success.contrastText,
      },
      background: {
        default: palette.background.default,
        paper: palette.background.paper,
      },
      text: {
        primary: palette.text.primary,
        secondary: palette.text.secondary,
        disabled: palette.text.disabled,
      },
    },
    typography: {
      fontFamily: palette.typography.fontFamily,
      h1: {
        fontSize: palette.typography.h1.fontSize,
        fontWeight: palette.typography.h1.fontWeight,
        lineHeight: palette.typography.h1.lineHeight,
      },
      h2: {
        fontSize: palette.typography.h2.fontSize,
        fontWeight: palette.typography.h2.fontWeight,
        lineHeight: palette.typography.h2.lineHeight,
      },
      h3: {
        fontSize: palette.typography.h3.fontSize,
        fontWeight: palette.typography.h3.fontWeight,
        lineHeight: palette.typography.h3.lineHeight,
      },
      h4: {
        fontSize: palette.typography.h4.fontSize,
        fontWeight: palette.typography.h4.fontWeight,
        lineHeight: palette.typography.h4.lineHeight,
      },
      h5: {
        fontSize: palette.typography.h5.fontSize,
        fontWeight: palette.typography.h5.fontWeight,
        lineHeight: palette.typography.h5.lineHeight,
      },
      h6: {
        fontSize: palette.typography.h6.fontSize,
        fontWeight: palette.typography.h6.fontWeight,
        lineHeight: palette.typography.h6.lineHeight,
      },
      body1: {
        fontSize: palette.typography.body1.fontSize,
        fontWeight: palette.typography.body1.fontWeight,
        lineHeight: palette.typography.body1.lineHeight,
      },
      body2: {
        fontSize: palette.typography.body2.fontSize,
        fontWeight: palette.typography.body2.fontWeight,
        lineHeight: palette.typography.body2.lineHeight,
      },
    },
    spacing: palette.spacing,
    shape: {
      borderRadius: palette.shape.borderRadius,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: palette.shape.borderRadius,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: palette.shape.borderRadius,
            boxShadow: palette.shadows.card,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: palette.shape.borderRadius,
          },
        },
      },
    },
  };

  return createTheme(baseTheme, options);
};

// Export default theme instance
export const defaultTheme = createMuiTheme();
