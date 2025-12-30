import { describe, expect, it } from 'vitest';

import { getTimeAgo } from '@/shared/utils/timeAgoHelper';

describe('getTimeAgo', () => {
  it('returns Just now for future or zero difference', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    expect(getTimeAgo(now, now)).toBe('Just now');
  });
  it('handles seconds/minutes/hours/days/months/years', () => {
    const base = new Date('2024-01-01T00:00:00Z').getTime();
    const now = new Date(base);
    expect(getTimeAgo(new Date(base - 1_000), now)).toMatch(/second/);
    expect(getTimeAgo(new Date(base - 61_000), now)).toMatch(/minute/);
    expect(getTimeAgo(new Date(base - 3_600_000), now)).toMatch(/hour/);
    expect(getTimeAgo(new Date(base - 86_400_000), now)).toMatch(/day/);
    expect(getTimeAgo(new Date(base - 30 * 86_400_000), now)).toMatch(/month/);
    expect(getTimeAgo(new Date(base - 365 * 86_400_000), now)).toMatch(/year/);
  });
});


