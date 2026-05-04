// App-side threads domain barrel.
//
// Re-exports the package's chat-side surface (model, queryKeys, cache helpers,
// chat queries) AND the app-only sidebar surface (paginated lists, mutations,
// draft thread helpers, service). This keeps `@/domains/threads` working for
// every existing call site without touching them.
export * from '@smartspace/chat-ui';

// Sidebar / non-chat exports stay in app.
export { ensureDraftThread, removeDraftThread } from './draftThread';
export { useDeleteThread, useRenameThread, useSetPin } from './mutations';
export { threadsListOptions, useInfiniteThreads, useThreads } from './queries';
export * from './service';
