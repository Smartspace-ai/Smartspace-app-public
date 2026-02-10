import { z } from 'zod';

const NAME_MIN = 1;
const NAME_MAX = 500;

export const threadRenameSchema = z.object({
  name: z
    .string()
    .min(NAME_MIN, 'Name is required')
    .max(NAME_MAX, `Name must be ${NAME_MAX} characters or fewer`)
    .transform((s) => s.trim())
    .refine((s) => s.length >= NAME_MIN, 'Name is required'),
});

export type ThreadRenameFormValues = z.infer<typeof threadRenameSchema>;
