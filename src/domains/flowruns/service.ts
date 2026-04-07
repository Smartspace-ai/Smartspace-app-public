import { ChatApi, ChatZod } from '@smartspace/api-client';

import { api } from '@/platform/api';
import { parseOrThrow } from '@/platform/validation';

import { mapFlowRunVariablesDtoToModel } from './mapper';

const { getFlowRunsIdVariablesResponse: flowRunVariablesSchema } = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

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
