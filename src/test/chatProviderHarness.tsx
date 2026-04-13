import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Subject } from 'rxjs';

import {
  ChatProvider,
  type ChatIdentity,
  type ChatService,
} from '@/platform/chat';

export type FakeChatServiceOverrides = Partial<ChatService>;

/**
 * Build a `ChatService` stub for tests. All methods default to sensible
 * no-ops / empty arrays, so you only override what the test under
 * exercise actually calls.
 */
export function createFakeChatService(
  overrides: FakeChatServiceOverrides = {}
): ChatService {
  return {
    fetchMessages: async () => [],
    sendMessage: () => new Subject(),
    addInputToMessage: async () => {
      throw new Error('addInputToMessage not stubbed');
    },
    uploadFiles: async () => [],
    downloadFile: async () => new Blob(),
    getFileInfo: async () => ({ id: '', name: '' }),
    getFileDownloadUrl: async () => '',
    fetchThread: async () => {
      throw new Error('fetchThread not stubbed');
    },
    fetchWorkspace: async () => {
      throw new Error('fetchWorkspace not stubbed');
    },
    fetchTaggableUsers: async () => [],
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
