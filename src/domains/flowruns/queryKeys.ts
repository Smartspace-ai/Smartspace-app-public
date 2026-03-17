export const flowRunsKeys = {
  all: ['flowruns'] as const,

  variables: (flowRunId: string) =>
    [...flowRunsKeys.all, 'variables', { flowRunId }] as const,

  mutations: () => [...flowRunsKeys.all, 'mutations'] as const,
  updateVariable: (flowRunId: string, variableName: string) =>
    [...flowRunsKeys.mutations(), 'updateVariable', { flowRunId, variableName }] as const,
};


