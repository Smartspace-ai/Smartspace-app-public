import { ModelRole } from '../enums/model-role';
import { Model } from './model';
import { ModelProperties } from './model-properties';

export class ModelConfiguration extends ModelProperties {
  id?: string;
  model?: Model;
  modelId?: string;
  prePrompt?: string;
  role?: ModelRole;
  modelDisplayText?: string;

  constructor(params?: ModelConfiguration) {
    super(params);
    Object.assign(this, params || {});
  }
}
