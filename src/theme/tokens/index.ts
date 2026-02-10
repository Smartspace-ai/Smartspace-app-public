/**
 * Design tokens. Components must use semantic tokens (via theme) only.
 * Core tokens are for building semantic tokens and theme — do not use in components.
 */

export { coreColors } from './core.colors';
export type { CoreColorRamp } from './core.colors';

export { semanticLight } from './semantic.light';
export type { SemanticLight } from './semantic.light';
export { semanticDark } from './semantic.dark';
export type { SemanticDark } from './semantic.dark';

export { typographyTokens } from './typography';
export type { TypographyTokens } from './typography';

export { spacingTokens, getSpacing } from './spacing';
export type { SpacingScale } from './spacing';

export { radiusTokens } from './radii';
export type { RadiusScale } from './radii';

export { motionTokens, transition as transitionToken } from './motion';

export { elevationTokens } from './elevation';
export type { ElevationLevel } from './elevation';

export { breakpointTokens } from './breakpoints';
export type { BreakpointKey } from './breakpoints';

export { zIndexTokens } from './zIndex';
export type { ZIndexKey } from './zIndex';
