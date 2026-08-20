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
  type Workspace,
} from '@smartspace/chat-ui';

/**
 * When a flow asks the user a question mid-thread, the turn carries a schema and
 * renders a form inside the bubble. That answer is a message being written, not
 * a setting being flipped: it gets the design's full field scale and a
 * composer-sized box that grows with the text — the variables bar's three-line
 * default was far too small for it.
 *
 * NOTE: `@smartspace/chat-ui` resolves to the package's built `dist`, so run
 * `pnpm --filter @smartspace/chat-ui build` after editing its source or this
 * asserts against the previous build. CI is safe — install runs `prepare`.
 */

const WORKSPACE_ID = '7c1f0e8b-2a4d-4c3e-9f51-8b6d0a2c4e77';
const THREAD_ID = '3d9a5c21-6f47-4b8e-a0c3-1e5f7b9d2a48';
const AT = new Date('2026-08-19T11:45:00Z');

/** 6 rows of the design's comfortable scale: 6 × 20px + 8px padding × 2 + 2px border. */
const SIX_ROWS_PX = 138;
/** Its 20-row ceiling, past which the box scrolls instead of growing. */
const TWENTY_ROWS_PX = 418;

const workspace = {
  id: WORKSPACE_ID,
  name: 'User Questions',
  tags: [],
  showSources: false,
  dataSpaces: [],
  favorited: false,
  summary: '',
  firstPrompt: '',
  variables: {},
  supportsFiles: false,
  avatarName: 'User Questions',
} as unknown as Workspace;

const thread: MessageThread = {
  id: THREAD_ID,
  createdAt: AT,
  createdBy: 'System',
  createdByUserId: '',
  isFlowRunning: false,
  lastUpdatedAt: AT,
  lastUpdatedByUserId: '',
  name: 'hello',
  totalMessages: 1,
  pinned: false,
  workSpaceId: WORKSPACE_ID,
  summaryEmittedAt: 0,
};

const question: Message = {
  id: 'f0c9b7a5-1d2e-4f38-8a6b-9c0d1e2f3a4b',
  createdAt: AT,
  createdBy: 'System',
  hasComments: false,
  messageThreadId: THREAD_ID,
  values: [
    {
      id: 'c4d5e6f7-8a9b-4c0d-9e1f-2a3b4c5d6e7f',
      // A question packet: the `_user` channel, on the output side.
      name: '_user',
      type: MessageValueType.OUTPUT,
      value: {
        message: "Hi! What's your name?",
        schema: {
          type: 'object',
          properties: { name: { type: 'string', title: 'Your name' } },
        },
      },
      channels: {},
      createdAt: AT,
      createdBy: 'System',
    },
  ],
};

const renderQuestion = () =>
  renderWithChat(<MessageList />, {
    workspaceId: WORKSPACE_ID,
    threadId: THREAD_ID,
    service: createFakeChatService({
      fetchMessages: async () => [question],
      fetchThread: async () => thread,
      fetchWorkspace: async () => workspace,
    }),
  });

describe('in-conversation question form', () => {
  it('answers in a composer-sized box that grows to a 20-row ceiling', async () => {
    const { container } = renderQuestion();

    const field = await waitFor(() => {
      const el = container.querySelector(
        '.ss-chat-message__user-form textarea'
      );
      expect(el).not.toBeNull();
      return el as HTMLTextAreaElement;
    });

    expect(field.style.minHeight).toBe(`${SIX_ROWS_PX}px`);
    expect(field.style.maxHeight).toBe(`${TWENTY_ROWS_PX}px`);
  });

  it('takes the design’s full field scale, not the variables list’s', async () => {
    const { container } = renderQuestion();

    const field = await waitFor(() => {
      const el = container.querySelector(
        '.ss-chat-message__user-form textarea'
      );
      expect(el).not.toBeNull();
      return el as HTMLTextAreaElement;
    });

    // `px-3 py-2 text-sm` is the reference's own field; `text-xs` would mean the
    // settings-list scale leaked into a message.
    expect(field.className).toContain('text-sm');
    expect(field.className).toContain('px-3');
    expect(field.className).toContain('py-2');
    expect(field.className).not.toContain('text-xs');
    expect(field.className).toContain('rounded-md');
  });

  it('offers Send, disabled until the answer validates', async () => {
    renderQuestion();

    const send = await screen.findByRole('button', { name: 'Send' });
    expect((send as HTMLButtonElement).disabled).toBe(true);
  });
});
