# Theming contract

## Rules

- **No raw hex** in components. Use semantic tokens via `theme.palette`, `theme.typography`, etc.
- **No hardcoded px** for spacing, font-size, or border-radius. Use `theme.spacing()`, typography variants, and `theme.shape.borderRadius` (or radius tokens).
- **No inline random transitions.** Use motion tokens from `@/theme/tokens/motion`.

## Token layers

1. **Core tokens** (`tokens/core.colors.ts`) — color ramps only. Do **not** use in components.
2. **Semantic tokens** (`tokens/semantic.light.ts`, `semantic.dark.ts`) — map semantic names (e.g. `bg.canvas`, `text.primary`) to values. MUI theme is built from these.
3. **Typography, spacing, radii, motion, elevation, zIndex** — use via theme or token imports in theme factory only.

## Using the theme

- `ThemeProvider` receives the theme from `@/theme/mui/createTheme` (`appTheme` or `createAppTheme(mode)`).
- In components: `useTheme()`, `sx={{ color: 'text.primary' }}`, or `styled()` with theme access.
- For CSS variables (e.g. whitelabel): we can inject semantic token values as `--token-name` in a wrapper; components then reference `var(--token-name)` where needed.

## Structure

- `src/theme/tokens/` — all design tokens
- `src/theme/mui/createTheme.ts` — builds MUI theme from tokens
- `src/theme/contracts/` — schema and this README for enforcement and documentation
