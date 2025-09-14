export const workspaceKeys = {
    all: ['workspaces'] as const,
  
    list: (searchTerm?: string) =>
      [...workspaceKeys.all, 'list', searchTerm ?? ''] as const,
  
    // single workspace by id
    byId: (workspaceId: string) =>
      [...workspaceKeys.all, 'byId', workspaceId] as const,
  
    // taggable users for a given workspace
    taggableUsers: (workspaceId: string) =>
      [...workspaceKeys.all, 'taggableUsers', workspaceId] as const,
  };
  