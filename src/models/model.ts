
export class Model {
  id?: string;
  name?: string;
  displayName?: string;
  modelDeploymentProviderType?: string;

  constructor(params?: Model) {
    Object.assign(this, params || {});
  }
}
