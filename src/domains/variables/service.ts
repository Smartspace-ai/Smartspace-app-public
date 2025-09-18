import { api } from '@/platform/api/apiClient';
import { ThreadVariablesResponseSchema } from './schemas';

export async function fetchThreadVariables(threadId: string): Promise<Record<string, any>> {
  const res = await api.get(`/flowruns/${threadId}/variables`);
  const validatedResponse = ThreadVariablesResponseSchema.parse(res);
  return validatedResponse.data ?? {};
}

export async function updateThreadVariable(params: {
  threadId: string;
  variableName: string;
  value: unknown;
}): Promise<void> {  await api.put(`/flowruns/${params.threadId}/variables/${params.variableName}`, 
    params.value,
 
    { headers: { 'Content-Type': 'application/json' } }
  );}
