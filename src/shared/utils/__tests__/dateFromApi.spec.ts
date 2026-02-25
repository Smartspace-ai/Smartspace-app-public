import { describe, expect, it } from 'vitest';

import { DateFromApi } from '@/shared/utils/dateFromApi';

describe('DateFromApi', () => {
  it('passes through Date objects unchanged', () => {
    const d = new Date('2024-06-01T12:00:00Z');
    expect(DateFromApi.parse(d)).toEqual(d);
  });

  it('parses ISO string with Z suffix', () => {
    const result = DateFromApi.parse('2024-06-01T12:00:00Z');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2024-06-01T12:00:00.000Z');
  });

  it('parses ISO string without timezone suffix', () => {
    const result = DateFromApi.parse('2024-06-01T12:00:00');
    expect(result).toBeInstanceOf(Date);
    expect(Number.isNaN(result.getTime())).toBe(false);
  });

  it('parses ISO string with offset', () => {
    const result = DateFromApi.parse('2024-06-01T12:00:00+00:00');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2024-06-01T12:00:00.000Z');
  });

  it('parses .NET 7-digit fractional seconds', () => {
    const result = DateFromApi.parse('2024-06-01T12:00:00.1234567');
    expect(result).toBeInstanceOf(Date);
    expect(Number.isNaN(result.getTime())).toBe(false);
  });

  it('parses numeric timestamp', () => {
    const ts = new Date('2024-06-01T12:00:00Z').getTime();
    const result = DateFromApi.parse(ts);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(ts);
  });

  it('rejects null', () => {
    expect(() => DateFromApi.parse(null)).toThrow();
  });

  it('rejects undefined', () => {
    expect(() => DateFromApi.parse(undefined)).toThrow();
  });
});
