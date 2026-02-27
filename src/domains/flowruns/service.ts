import { api } from '@/platform/api';
import { getSmartSpaceChatAPI } from '@/platform/api/generated/chat/api';
import { getFlowRunsIdVariablesResponse as flowRunVariablesSchema } from '@/platform/api/generated/chat/zod';
import { parseOrThrow } from '@/platform/validation';

import { mapFlowRunVariablesDtoToModel } from './mapper';

const chatApi = getSmartSpaceChatAPI();

export async function fetchFlowRunVariables(flowRunId: string) {
  const response = await chatApi.getFlowRunsIdVariables(flowRunId);
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
