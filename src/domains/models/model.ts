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
  modelPublisher: string | null;
  createdByUserId: string;
  createdAt: Date;
  properties: ModelProperty[];
  virtualMachineUrl: string | null;
};
