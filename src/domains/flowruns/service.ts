import { ChatApi, ChatZod } from '@smartspace/api-client';

import { api } from '@/platform/api';
import type { AppError } from '@/platform/envelopes';
import { parseOrThrow } from '@/platform/validation';

import { mapFlowRunVariablesDtoToModel } from './mapper';

const { flowRunsGetVariablesResponse: flowRunVariablesSchema } = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

export async function fetchFlowRunVariables(flowRunId: string) {
  const response = await chatApi.flowRunsGetVariables(flowRunId);
  const parsed = parseOrThrow(
    flowRunVariablesSchema,
    response.data,
    `GET /flowruns/${flowRunId}/variables`
  );
  return mapFlowRunVariablesDtoToModel(parsed);
}

export async function updateFlowRunVariable(
  flowRunId: string,
  variableName: string,
  value: unknown
) {
  return await api.put(
    `/flowruns/${flowRunId}/variables/${variableName}`,
    value,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Raw call (endpoint newer than the generated client — swap once the SDK
// republishes). Conflict (409) = the run finished before the cancel landed;
// success as far as the UI is concerned, the running flag clears on its own.
export async function cancelFlowRun(flowRunId: string) {
  try {
    await api.post(`/flowruns/${flowRunId}/cancel`);
  } catch (error) {
    if ((error as AppError)?.type === 'Conflict') return;
    throw error;
  }
}
