import { screen, waitFor } from '@testing-library/react';
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
  type MessageValue,
  type Workspace,
} from '@smartspace/chat-ui';

/**
 * The thinking row stays under the last message for as long as its flow runs,
 * so a user can tell more outputs are coming after the first answer. It reads
 * the flow's latest status, else "Thinking…" before any output and "Still
 * working…" after.
 *
 * NOTE: `@smartspace/chat-ui` resolves to the package's built `dist`, so run
 * `pnpm --filter @smartspace/chat-ui build` after editing its source or this
 * asserts against the previous build. CI is safe — install runs `prepare`.
 */

const WORKSPACE_ID = '980ec9fd-273a-4692-bb89-1cef7230a4b9';
const THREAD_ID = '69441647-2a3e-45ad-ab61-af59a4e95929';

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

const at = (seconds: number) =>
  new Date(`2026-11-24T06:00:${String(seconds).padStart(2, '0')}Z`);

const value = (
  id: string,
  name: string,
  type: MessageValueType,
  content: unknown,
  seconds: number
): MessageValue =>
  ({
    id,
    name,
    type,
    value: content,
    channels: {},
    createdAt: at(seconds),
    createdBy: 'System',
  } as MessageValue);

const prompt = value(
  '11111111-1111-1111-1111-111111111111',
  'prompt',
  MessageValueType.INPUT,
  [{ text: 'Tell me about owls.' }],
  0
);
const answer = value(
  '22222222-2222-2222-2222-222222222222',
  'response',
  MessageValueType.OUTPUT,
  'Owls can turn their heads about 270 degrees.',
  2
);
const status = value(
  '33333333-3333-3333-3333-333333333333',
  'status',
  MessageValueType.OUTPUT,
  'Preparing a follow-up...',
  3
);

const renderThread = (values: MessageValue[], isFlowRunning: boolean) => {
  const thread: MessageThread = {
    id: THREAD_ID,
    createdAt: at(0),
    createdBy: 'System',
    createdByUserId: '',
    isFlowRunning,
    lastUpdatedAt: at(0),
    lastUpdatedByUserId: '',
    name: 'Owls',
    totalMessages: 1,
    pinned: false,
    workSpaceId: WORKSPACE_ID,
    summaryEmittedAt: 0,
  };
  return renderWithChat(<MessageList />, {
    workspaceId: WORKSPACE_ID,
    threadId: THREAD_ID,
    service: createFakeChatService({
      fetchMessages: async (): Promise<Message[]> => [
        {
          id: '512e3c54-cbd6-450a-b46f-29be1d49af50',
          createdAt: at(0),
          createdBy: 'System',
          hasComments: false,
          messageThreadId: THREAD_ID,
          values,
        },
      ],
      fetchThread: async () => thread,
      fetchWorkspace: async () => workspace,
    }),
  });
};

describe('thinking row', () => {
  it('shows "Thinking…" before any output', async () => {
    renderThread([prompt], true);

    expect((await screen.findByRole('status')).textContent).toContain(
      'Thinking…'
    );
  });

  it('stays under the answer while the flow runs', async () => {
    renderThread([prompt, answer], true);

    await screen.findByText(answer.value as string);
    expect((await screen.findByRole('status')).textContent).toContain(
      'Still working…'
    );
  });

  it("reads the flow's latest status after the answer", async () => {
    renderThread([prompt, answer, status], true);

    expect((await screen.findByRole('status')).textContent).toContain(
      'Preparing a follow-up...'
    );
  });

  it('goes away when the flow finishes', async () => {
    renderThread([prompt, answer, status], false);

    await screen.findByText(answer.value as string);
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });
});
