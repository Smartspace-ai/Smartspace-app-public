export enum ModelRole {
  Document = 'Document',
  Agent = 'Agent',
  Analyzer = 'Analyzer',
}

export const ModelRoleMapping = {
  [ModelRole.Agent]: {
    displayName: 'Base Model',
  },
  [ModelRole.Document]: {
    displayName: 'Collector',
  },
  [ModelRole.Analyzer]: {
    id: 'analyzer',
    displayName: 'Analyzer',
  },
};
