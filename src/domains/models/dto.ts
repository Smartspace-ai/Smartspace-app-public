import { z } from 'zod';

export const ModelPropertyDto = z.object({
  name: z.string(),
  type: z.string(),
  defaultValue: z.number(),
  minValue: z.number(),
  maxValue: z.number(),
  step: z.number(),
});

export const ModelDto = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  deploymentStatus: z.string(),
  modelDeploymentProviderType: z.string(),
  createdByUserId: z.string(),
  createdAt: z.string(),
  properties: z.array(ModelPropertyDto),
  virtualMachineUrl: z.string().nullable(),
});
export type TModelDto = z.infer<typeof ModelDto>;

export const ModelsEnvelopeDto = z.object({
  data: z.array(ModelDto),
  total: z.number().int().nonnegative(),
});

export type TModelsEnvelopeDto = z.infer<typeof ModelsEnvelopeDto>;





