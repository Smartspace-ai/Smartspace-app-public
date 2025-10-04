import { api } from '@/platform/api';
import { apiParsed } from '@/platform/apiParsed';
import { FlowRunVariablesDto } from './dto';
import { mapFlowRunVariablesDtoToModel } from './mapper';

export async function fetchFlowRunVariables(flowRunId: string) {
  const dto = await apiParsed.get(FlowRunVariablesDto, `/flowruns/${flowRunId}/variables`);
  return mapFlowRunVariablesDtoToModel(dto);
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


