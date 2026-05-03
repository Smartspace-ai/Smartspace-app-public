import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import {
  ChatProvider,
  type ChatIdentity,
  type ChatService,
} from '@/platform/chat';

export type FakeChatServiceOverrides = Partial<ChatService>;

/**
 * Build a `ChatService` stub for tests. Every method throws by default — tests
 * must explicitly override the methods they exercise. This keeps unmocked
 * calls loud instead of letting them quietly return empty arrays / blobs and
 * masking missing setup.
 */
export function createFakeChatService(
  overrides: FakeChatServiceOverrides = {}
): ChatService {
  const notStubbed = (method: string) => () => {
    throw new Error(`ChatService.${method} not stubbed`);
  };
  return {
    fetchMessages: notStubbed('fetchMessages'),
    sendMessage: notStubbed('sendMessage'),
    addInputToMessage: notStubbed('addInputToMessage'),
    uploadFiles: notStubbed('uploadFiles'),
    downloadFile: notStubbed('downloadFile'),
    getFileInfo: notStubbed('getFileInfo'),
    getFileDownloadUrl: notStubbed('getFileDownloadUrl'),
    fetchThread: notStubbed('fetchThread'),
    fetchWorkspace: notStubbed('fetchWorkspace'),
    fetchTaggableUsers: notStubbed('fetchTaggableUsers'),
    ...overrides,
  };
}

export type ChatHarnessOptions = {
  service?: ChatService;
  workspaceId?: string;
  threadId?: string;
  identity?: ChatIdentity;
  queryClient?: QueryClient;
};

const DEFAULT_IDENTITY: ChatIdentity = {
  userId: 'test-user',
  displayName: 'Test User',
};

/**
 * Build the provider wrapper used by `render` / `renderHook`. Returns both
 * the wrapper and the `QueryClient` so tests can inspect cache state.
 */
export function buildChatHarness(opts: ChatHarnessOptions = {}) {
  const queryClient = opts.queryClient ?? new QueryClient();
  const service = opts.service ?? createFakeChatService();
  const workspaceId = opts.workspaceId ?? 'test-workspace';
  const threadId = opts.threadId ?? 'test-thread';
  const identity = opts.identity ?? DEFAULT_IDENTITY;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ChatProvider
        service={service}
        workspaceId={workspaceId}
        threadId={threadId}
        identity={identity}
      >
        {children}
      </ChatProvider>
    </QueryClientProvider>
  );

  return { wrapper, queryClient, service };
}

export function renderWithChat(
  ui: ReactElement,
  opts: ChatHarnessOptions = {}
) {
  const { wrapper, queryClient, service } = buildChatHarness(opts);
  const rendered = render(ui, { wrapper });
  return { ...rendered, queryClient, service };
}

export function renderHookWithChat<TResult, TProps>(
  hook: (initialProps: TProps) => TResult,
  opts: ChatHarnessOptions & { initialProps?: TProps } = {}
) {
  const { wrapper, queryClient, service } = buildChatHarness(opts);
  const rendered = renderHook(hook, {
    wrapper,
    initialProps: opts.initialProps,
  });
  return { ...rendered, queryClient, service };
}
