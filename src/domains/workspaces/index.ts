// App-side workspaces domain barrel — exports the app-only sidebar surface
// (paginated workspaces list, fetch helpers). Package chat-side exports
// (model, queryKeys, useWorkspace, taggable users) live at `@smartspace/chat-ui`
// and should be imported from there directly.
export { useWorkspaces, workspacesListOptions } from './queries';
export { fetchTaggableUsers, fetchWorkspace, fetchWorkspaces } from './service';
