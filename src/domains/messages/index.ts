// App-side messages domain barrel — exports the app-only SDK-bound service
// and the legacy `useThreadMessageStream` hook. Package chat-side exports
// (model, queries, mutations, mappers, queryKeys) live at `@smartspace/chat-ui`
// and should be imported from there directly.
export * from './service';
export { useThreadMessageStream } from './threadStream';
