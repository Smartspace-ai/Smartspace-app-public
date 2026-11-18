import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  createFakeChatService,
  renderWithChat,
} from '@/test/chatProviderHarness';
import {
  MessageList,
  MessageValueType,
  type Message,
  type MessageThread,
  type Workspace,
} from '@smartspace/chat-ui';

/**
 * An LLM block's `reasoning` pin, wired to a flow output named `reasoning`,
 * shows behind a collapsed disclosure rather than as part of the answer. The
 * pin sends '' on every call with nothing to report, and that shows nothing.
 *
 * NOTE: `@smartspace/chat-ui` resolves to the package's built `dist`, so run
 * `pnpm --filter @smartspace/chat-ui build` after editing its source or this
 * asserts against the previous build. CI is safe — install runs `prepare`.
 */

const WORKSPACE_ID = '980ec9fd-273a-4692-bb89-1cef7230a4b9';
const THREAD_ID = '69441647-2a3e-45ad-ab61-af59a4e95929';
const AT = new Date('2026-11-17T20:42:03Z');

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
  name: 'Reasoning',
  totalMessages: 1,
  pinned: false,
  workSpaceId: WORKSPACE_ID,
  summaryEmittedAt: 0,
};

const renderWithReasoning = (
  reasoning: string,
  reasoningAt = new Date('2026-11-17T20:42:02Z')
) =>
  renderWithChat(<MessageList />, {
    workspaceId: WORKSPACE_ID,
    threadId: THREAD_ID,
    service: createFakeChatService({
      fetchMessages: async (): Promise<Message[]> => [
        {
          id: '512e3c54-cbd6-450a-b46f-29be1d49af50',
          createdAt: AT,
          createdBy: 'System',
          hasComments: false,
          messageThreadId: THREAD_ID,
          values: [
            {
              id: '21111111-1111-1111-1111-111111111111',
              name: 'reasoning',
              type: MessageValueType.OUTPUT,
              value: reasoning,
              channels: {},
              createdAt: reasoningAt,
              createdBy: 'System',
            },
            {
              id: 'a6fe843e-ad88-4d5e-9aad-5cf45ae27735',
              name: 'response',
              type: MessageValueType.OUTPUT,
              value: 'Paris.',
              channels: {},
              createdAt: AT,
              createdBy: 'System',
            },
          ],
        },
      ],
      fetchThread: async () => thread,
      fetchWorkspace: async () => workspace,
    }),
  });

describe('reasoning rendering', () => {
  it('keeps reasoning behind a collapsed disclosure', async () => {
    const { container } = renderWithReasoning('Recalled the capital.');

    await waitFor(() => expect(container.textContent).toContain('Paris.'));
    expect(container.textContent).not.toContain('Recalled the capital.');

    fireEvent.click(screen.getByText('Show reasoning'));

    expect(container.textContent).toContain('Recalled the capital.');
  });

  // A streamed answer is in the message before the reasoning its LLM call
  // sends at the end; the disclosure still goes above the answer.
  it('puts reasoning above an answer that arrived first', async () => {
    renderWithReasoning(
      'Recalled the capital.',
      new Date('2026-11-17T20:42:04Z')
    );

    const answer = await screen.findByText('Paris.');
    const toggle = screen.getByText('Show reasoning');
    expect(
      toggle.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('shows nothing for an empty reasoning value', async () => {
    const { container } = renderWithReasoning('');

    await waitFor(() => expect(container.textContent).toContain('Paris.'));
    expect(screen.queryByText('Show reasoning')).toBeNull();
  });
});
