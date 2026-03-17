import { describe, expect, it } from 'vitest';

import { getAvatarColour } from '@/shared/utils/avatarColour';

describe('getAvatarColour', () => {
  it('returns hsl background and readable text color', () => {
    const a = getAvatarColour('John Doe');
    expect(a.backgroundColor.startsWith('hsl(')).toBe(true);
    expect(['#000000', '#FFFFFF']).toContain(a.textColor);
  });
  it('is deterministic for same name', () => {
    const a = getAvatarColour('Jane');
    const b = getAvatarColour('Jane');
    expect(a).toEqual(b);
  });
});


