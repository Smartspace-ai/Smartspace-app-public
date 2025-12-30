import { z } from 'zod';

export const DrawSchema = z.object({
  handleOpen: z.function().args().returns(z.void()),
  handleClose: z.function().args().returns(z.void()),
  open: z.boolean(),
  handleToggle: z.function().args(z.boolean().optional()).returns(z.void()),
});

export type Draw = z.infer<typeof DrawSchema>;
