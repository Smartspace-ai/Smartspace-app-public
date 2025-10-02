import { api } from '@/platform/api/apiClient';

export async function fetchFlowRunVariables(flowRunId: string) {
  const response = await api.get(`/flowruns/${flowRunId}/variables`);
  return response.data as Record<string, unknown>;
}

export async function updateFlowRunVariable(
  flowRunId: string,
  variableName: string,
  value: unknown
) {
  return await api.put(`/flowruns/${flowRunId}/variables/${variableName}`, value, {
    headers: { 'Content-Type': 'application/json' },
  });
}


