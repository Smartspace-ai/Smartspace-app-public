import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  createFakeChatService,
  renderWithChat,
} from '@/test/chatProviderHarness';
import {
  MessageList,
  type MessageThread,
  type Workspace,
} from '@smartspace/chat-ui';

/**
 * A thread that fails to load is shown as an error inside the chat column,
 * with a way to try again. The thread route's loader no longer throws on a
 * server error, so this is the state the user sees instead of the full-screen
 * error page.
 *
 * NOTE: `@smartspace/chat-ui` resolves to the package's built `dist`, so run
 * `pnpm --filter @smartspace/chat-ui build` after editing its source or this
 * asserts against the previous build. CI is safe — install runs `prepare`.
 */

const WORKSPACE_ID = '5b9e2c41-7a3d-4f1e-9c8b-2d6a1e4f7b90';
const THREAD_ID = 'c3f8a1d2-4b6e-4c9a-8e7f-1a2b3c4d5e6f';
const AT = new Date('2026-11-16T09:00:00Z');

describe('message list: a thread that fails to load', () => {
  it('says the thread failed to load, and loads it on Try again once the API answers', async () => {
    let apiUp = false;
    const thread: MessageThread = {
      id: THREAD_ID,
      createdAt: AT,
      createdBy: 'System',
      createdByUserId: '',
      isFlowRunning: false,
      lastUpdatedAt: AT,
      lastUpdatedByUserId: '',
      name: 'Supplier contracts',
      totalMessages: 0,
      pinned: false,
      workSpaceId: WORKSPACE_ID,
      summaryEmittedAt: 0,
    };
    const fetchThread = vi.fn(async () => {
      if (!apiUp) throw new Error('Request failed with status 500');
      return thread;
    });

    renderWithChat(<MessageList />, {
      workspaceId: WORKSPACE_ID,
      threadId: THREAD_ID,
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
      service: createFakeChatService({
        fetchThread,
        fetchMessages: async () => [],
        fetchWorkspace: async () =>
          ({
            id: WORKSPACE_ID,
            name: 'Contract Review',
            tags: [],
            summary: '',
            firstPrompt: '',
            variables: {},
          } as unknown as Workspace),
      }),
    });

    // Breaks if the error branch is removed: the user sees a blank column.
    expect(await screen.findByText('Failed to load thread')).toBeTruthy();

    // Breaks if Try again is not wired to a refetch: the error stays.
    apiUp = true;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() =>
      expect(screen.queryByText('Failed to load thread')).toBeNull()
    );
    expect(fetchThread).toHaveBeenCalledTimes(2);
  });
});
