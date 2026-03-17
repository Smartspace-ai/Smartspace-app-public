// src/domains/workspaces/index.ts
// Public API of the workspaces domain

// Types the UI/pages should use
export type {
    MentionUser, Variables, Workspace
} from './model';
  
  // React Query keys
  export { workspaceKeys } from './queryKeys';
  
  // Queries (hooks + options)
  export {
    taggableUsersOptions, useTaggableWorkspaceUsers, useWorkspace, useWorkspaces, workspaceDetailOptions, workspacesListOptions
} from './queries';
  
// Service surface (for tests and advanced callers)
export { fetchTaggableUsers, fetchWorkspace, fetchWorkspaces } from './service';
  
