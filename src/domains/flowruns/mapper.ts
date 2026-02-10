import { FlowRunVariables } from './model';

export function mapFlowRunVariablesDtoToModel(dto: unknown): FlowRunVariables {
  return dto as FlowRunVariables;
}
