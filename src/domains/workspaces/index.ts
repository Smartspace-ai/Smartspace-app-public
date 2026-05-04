// App-side workspaces domain barrel.
//
// Re-exports the package's chat-side surface (model, queryKeys, useWorkspace,
// taggable users) plus the app-only sidebar surface (workspacesListOptions /
// useWorkspaces / fetchWorkspaces).
export * from '@smartspace/chat-ui';
export { useWorkspaces, workspacesListOptions } from './queries';
export { fetchTaggableUsers, fetchWorkspace, fetchWorkspaces } from './service';
