import { ModelProperties } from './model-properties';

export class Model {
  id?: string;
  name?: string;
  displayName?: string;
  // deployment?: ModelDeployment;
  deployment?: any;
  properties?: ModelProperties[];

  constructor(params?: Model) {
    Object.assign(this, params || {});
  }
}
