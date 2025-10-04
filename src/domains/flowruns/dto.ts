import { z } from 'zod';

export const FlowRunVariablesDto = z.record(z.any());
export type TFlowRunVariablesDto = z.infer<typeof FlowRunVariablesDto>;






