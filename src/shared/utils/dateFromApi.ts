import { z } from 'zod';

/**
 * Zod schema that accepts a Date, ISO string, or numeric timestamp
 * from the API and coerces it to a Date object.
 */
export const DateFromApi = z.preprocess((v) => {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  return v;
}, z.date());
