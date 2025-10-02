import { ZodSchema, z } from 'zod';

export function safeParse<T extends ZodSchema<any>>(
  schema: T,
  data: unknown,
  context?: string
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod parse error${context ? ` in ${context}` : ''}]`, err);
    throw err;
  }
}
