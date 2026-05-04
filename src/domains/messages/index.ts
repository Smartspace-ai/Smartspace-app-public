// App-side messages domain barrel.
//
// Re-exports the package's chat-side surface plus the app-only service
// + the legacy useThreadMessageStream hook (still in app because it
// depends on @/platform/log and the SDK-bound streamThreadMessages).
export * from '@smartspace/chat-ui';
export * from './service';
export { useThreadMessageStream } from './threadStream';
