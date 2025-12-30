import { z } from 'zod';

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  deploymentStatus: z.string(),
  modelDeploymentProviderType: z.string(),
  createdByUserId: z.string(),
  createdAt: z.string(),
  properties: z.array(z.object({
    name: z.string(),
    type: z.string(),
    defaultValue: z.number(),
    minValue: z.number(),
    maxValue: z.number(),
    step: z.number(),
  })),
  virtualMachineUrl: z.string().nullable(),
});

export const ModelPropertiesSchema = z
  .object({
    frequencyPenalty: z.number().optional(),
    presencePenalty: z.number().optional(),
    temperature: z.number().optional(),
    topP: z.number().optional(),
  })
  .catchall(z.any());



export type Model = z.infer<typeof ModelSchema>;
export const ModelListSchema = z.array(ModelSchema)
export type ModelList = z.infer<typeof ModelListSchema>
/** Envelope the API returns for list endpoints */
export const ModelsEnvelopeSchema = z.object({
  data: z.array(ModelSchema),
  total: z.number().int().nonnegative(),
}).passthrough();

export type ModelsEnvelope = z.infer<typeof ModelsEnvelopeSchema>;
