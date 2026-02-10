/**
 * Motion tokens. All transitions must use these; no inline random transitions.
 */

export const motionTokens = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

/** Build transition string for a single property. */
export function transition(
  property: string,
  duration: keyof typeof motionTokens.duration = 'normal',
  easing: keyof typeof motionTokens.easing = 'standard'
): string {
  const ms = motionTokens.duration[duration];
  const ease = motionTokens.easing[easing];
  return `${property} ${ms}ms ${ease}`;
}
