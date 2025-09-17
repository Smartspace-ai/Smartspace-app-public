import { z } from 'zod';

export const ThreadVariablesResponseSchema = z.object({
  data: z.record(z.unknown())
});

export const UpdateThreadVariableParamsSchema = z.object({
  threadId: z.string(),
  variableName: z.string(),
  value: z.unknown()
});

export type ThreadVariablesResponse = z.infer<typeof ThreadVariablesResponseSchema>;
export type UpdateThreadVariableParams = z.infer<typeof UpdateThreadVariableParamsSchema>;