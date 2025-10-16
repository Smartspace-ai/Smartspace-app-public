export type ModelProperty = {
  name: string;
  type: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
  step: number;
};

export type Model = {
  id: string;
  name: string;
  displayName: string;
  deploymentStatus: string;
  modelDeploymentProviderType: string;
  createdByUserId: string;
  createdAt: string;
  properties: ModelProperty[];
  virtualMachineUrl: string | null;
};






