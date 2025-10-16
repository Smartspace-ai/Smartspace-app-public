import { describe, expect, it } from 'vitest';

import { getInitials } from '@/shared/utils/initials';

describe('getInitials', () => {
  it('returns Y for You', () => {
    expect(getInitials('You')).toBe('Y');
  });
  it('returns first and last initials for multi-word names', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('mary ann smith')).toBe('MS');
  });
  it('returns first two letters for single word', () => {
    expect(getInitials('Alice')).toBe('AL');
  });
  it('handles empty/undefined gracefully', () => {
    // @ts-expect-error testing runtime behavior
    expect(getInitials(undefined)).toBe('');
    expect(getInitials('')).toBe('');
  });
});


