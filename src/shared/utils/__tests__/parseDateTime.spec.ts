import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { parseDateTime, parseDateTimeHuman } from '@/shared/utils/parseDateTime';

describe('parseDateTime', () => {
  it('returns unix seconds with custom format X independent of timezone', () => {
    const input = '2024-06-01T12:34:56Z';
    const expected = Math.floor(new Date(input).getTime() / 1000).toString();
    expect(parseDateTime(input, 'X')).toBe(expected);
  });

  it('supports custom year format', () => {
    expect(parseDateTime('2024-03-15T00:00:00Z', 'YYYY')).toBe('2024');
  });
});

describe('parseDateTimeHuman', () => {
  const fixedNow = new Date('2024-01-01T00:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns a human readable relative string', () => {
    const earlier = new Date('2023-12-31T23:59:00Z').toISOString();
    const human = parseDateTimeHuman(earlier);
    expect(typeof human).toBe('string');
    expect(human.length).toBeGreaterThan(0);
    expect(human).toMatch(/ago|in/);
  });
});


