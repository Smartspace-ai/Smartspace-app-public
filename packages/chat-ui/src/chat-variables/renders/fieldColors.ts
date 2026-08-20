/**
 * Theme tokens as colour strings, for the variable renderers that style
 * themselves inline (MUI `sx` and `style` beat any stylesheet, so they can't be
 * themed from CSS).
 *
 * These fields used to carry a fixed light palette — white boxes with slate
 * labels — which read as broken on the dark composer, and worse once several of
 * them were gathered in the variables panel. Going through the tokens makes
 * them follow the host's theme, the way the pill renderers already do.
 */
export const fieldColor = {
  text: 'hsl(var(--foreground))',
  mutedText: 'hsl(var(--muted-foreground))',
  surface: 'hsl(var(--background))',
  surfaceDisabled: 'hsl(var(--muted))',
  menuSurface: 'hsl(var(--popover))',
  border: 'hsl(var(--border))',
  borderHover: 'hsl(var(--muted-foreground) / 0.6)',
  hairline: 'hsl(var(--border) / 0.5)',
  accent: 'hsl(var(--primary))',
  danger: 'hsl(var(--destructive))',
  optionHover: 'hsl(var(--secondary))',
  optionSelected: 'hsl(var(--primary) / 0.12)',
  optionSelectedHover: 'hsl(var(--primary) / 0.2)',
} as const;
