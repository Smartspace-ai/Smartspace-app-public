import { z } from 'zod';

export const DrawSchema = z.object({
  handleOpen: z.any(), // Function - Zod v4 z.function() API changed
  handleClose: z.any(),
  open: z.boolean(),
  handleToggle: z.any(),
});

export type Draw = z.infer<typeof DrawSchema>;
