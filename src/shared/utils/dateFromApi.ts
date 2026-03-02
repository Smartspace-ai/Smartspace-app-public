import { z } from 'zod';

/**
 * Zod schema that coerces a Date, ISO string, or numeric timestamp
 * from the API into a Date object.
 */
export const DateFromApi = z.coerce.date();
