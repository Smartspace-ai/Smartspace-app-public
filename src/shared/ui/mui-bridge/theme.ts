import { createTheme } from '@mui/material/styles';

// Map existing CSS variables (whitelabel) into a MUI theme.
// We intentionally reference CSS vars directly so brand switches propagate
// without recreating the theme. Avoids visual drift and keeps Tailwind tokens.

// Note: shape.borderRadius expects a number (px). 0.5rem ≈ 8px.
const BORDER_RADIUS_PX = 8;

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: 'hsl(var(--primary))',
      contrastText: 'hsl(var(--primary-foreground))',
    },
    secondary: {
      main: 'hsl(var(--secondary))',
      contrastText: 'hsl(var(--secondary-foreground))',
    },
    error: {
      main: 'hsl(var(--destructive))',
      contrastText: 'hsl(var(--destructive-foreground))',
    },
    background: {
      default: 'hsl(var(--background))',
      paper: 'hsl(var(--card))',
    },
    text: {
      primary: 'hsl(var(--foreground))',
    },
    divider: 'hsl(var(--border))',
  },
  typography: {
    // Use the app's (Tailwind) font stack to avoid MUI's default Roboto styles
    fontFamily: 'inherit',
    button: {
      textTransform: 'none',
      letterSpacing: 'inherit',
      fontWeight: 'inherit',
    },
  },
  shape: {
    borderRadius: BORDER_RADIUS_PX,
  },
  components: {
    // Keep MUI visually neutral; we will rely on Tailwind utilities and our tokens
    // to avoid any sudden visual shifts. We'll add targeted overrides as we migrate.
    MuiButtonBase: {
      defaultProps: {
        disableTouchRipple: true,
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
        },
      },
    },
  },
});


