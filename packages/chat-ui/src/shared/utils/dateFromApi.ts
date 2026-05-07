import { z } from 'zod';

/** True when the ISO string already carries timezone info (Z or ±HH:MM offset). */
const hasTimezone = (s: string) => /Z|[+-]\d{2}:\d{2}$/.test(s);

/**
 * Treat an API date string as UTC even when it lacks a trailing "Z".
 * If already a Date, returns it as-is (Date stores UTC internally).
 */
export function utcDate(value: string | Date): Date {
  if (typeof value === 'string' && !hasTimezone(value)) {
    return new Date(value + 'Z');
  }
  return new Date(value);
}

/**
 * Zod schema that coerces a Date, ISO string, or numeric timestamp
 * from the API into a Date object, ensuring timezone-less strings
 * are treated as UTC.
 */
export const DateFromApi = z.preprocess((val) => {
  if (typeof val === 'string' && !hasTimezone(val)) {
    return val + 'Z';
  }
  return val;
}, z.coerce.date());
