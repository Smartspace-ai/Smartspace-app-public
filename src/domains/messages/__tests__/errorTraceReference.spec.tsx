import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  createFakeChatService,
  renderWithChat,
} from '@/test/chatProviderHarness';
import {
  MessageList,
  type Message,
  type MessageThread,
  type Workspace,
} from '@smartspace/chat-ui';

/**
 * A message error can carry the trace id of the request that recorded it. The
 * reader reaches it through the "Show details" disclosure under the error
 * bubble, whoever they are — the id is what they quote to support.
 *
 * NOTE: `@smartspace/chat-ui` resolves to the package's built `dist`, so run
 * `pnpm --filter @smartspace/chat-ui build` after editing its source or this
 * asserts against the previous build. CI is safe — install runs `prepare`.
 */

const WORKSPACE_ID = '980ec9fd-273a-4692-bb89-1cef7230a4b9';
const THREAD_ID = '69441647-2a3e-45ad-ab61-af59a4e95929';
const AT = new Date('2026-08-16T20:42:03Z');
const TRACE_ID = '0af7651916cd43dd8448eb211c80319c';

const workspace = {
  id: WORKSPACE_ID,
  name: 'Research',
  tags: [],
  showSources: false,
  dataSpaces: [],
  favorited: false,
  summary: '',
  firstPrompt: '',
  variables: {},
  supportsFiles: false,
  avatarName: 'Research',
} as unknown as Workspace;

const thread: MessageThread = {
  id: THREAD_ID,
  createdAt: AT,
  createdBy: 'System',
  createdByUserId: '',
  isFlowRunning: false,
  lastUpdatedAt: AT,
  lastUpdatedByUserId: '',
  name: 'Failed run',
  totalMessages: 1,
  pinned: false,
  workSpaceId: WORKSPACE_ID,
  summaryEmittedAt: 0,
};

const renderError = (error: NonNullable<Message['errors']>[number]) =>
  renderWithChat(<MessageList />, {
    workspaceId: WORKSPACE_ID,
    threadId: THREAD_ID,
    service: createFakeChatService({
      fetchMessages: async () => [
        {
          id: '512e3c54-cbd6-450a-b46f-29be1d49af50',
          createdAt: AT,
          createdBy: 'System',
          hasComments: false,
          messageThreadId: THREAD_ID,
          values: [],
          errors: [error],
        },
      ],
      fetchThread: async () => thread,
      fetchWorkspace: async () => workspace,
    }),
  });

/** Every rendered bubble carries the copy control, so waiting on it means the
 *  error bubble is up before the disclosure is looked for. */
const errorBubble = async (container: HTMLElement) =>
  waitFor(() =>
    expect(
      container.querySelector('[aria-label="Copy message content"]')
    ).not.toBeNull()
  );

describe('message error trace reference', () => {
  it('offers the trace id under an error that has no provider detail', async () => {
    renderError({
      code: 503,
      errorCode: 'ai_api.unavailable',
      traceId: TRACE_ID,
    });

    fireEvent.click(await screen.findByText('Show details'));

    expect(screen.getByText(`Reference: ${TRACE_ID}`)).toBeTruthy();
  });

  it('shows the trace id alongside the provider detail', async () => {
    renderError({
      code: 503,
      errorCode: 'ai_api.stream_broken',
      message: 'The stream ended early',
      traceId: TRACE_ID,
    });

    fireEvent.click(await screen.findByText('Show details'));

    expect(screen.getByText('The stream ended early')).toBeTruthy();
    expect(screen.getByText(`Reference: ${TRACE_ID}`)).toBeTruthy();
  });

  it('offers no disclosure when the error has neither detail nor trace id', async () => {
    const { container } = renderError({ code: 503 });

    await errorBubble(container);

    expect(screen.queryByText('Show details')).toBeNull();
  });
});
