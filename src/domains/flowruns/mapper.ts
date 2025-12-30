import { TFlowRunVariablesDto } from './dto';
import { FlowRunVariables } from './model';

export function mapFlowRunVariablesDtoToModel(dto: TFlowRunVariablesDto): FlowRunVariables {
  return dto as FlowRunVariables;
}






