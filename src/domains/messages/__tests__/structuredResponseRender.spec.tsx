import { waitFor } from '@testing-library/react';
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
 * A block can wire a schema-shaped object straight onto the `Response` pin —
 * a research flow returning `{ status, company, competitors, … }`, say. That
 * is not the `{ content, sources }` envelope, and unwrapping it as one found
 * `.content` undefined and rendered no bubble at all: the thread showed the
 * user's prompt and nothing after it, with no error anywhere.
 *
 * NOTE: `@smartspace/chat-ui` resolves to the package's built `dist`, so run
 * `pnpm --filter @smartspace/chat-ui build` after editing its source or this
 * asserts against the previous build. CI is safe — install runs `prepare`.
 */

const WORKSPACE_ID = '980ec9fd-273a-4692-bb89-1cef7230a4b9';
const THREAD_ID = '69441647-2a3e-45ad-ab61-af59a4e95929';
const AT = new Date('2026-08-16T20:42:03Z');

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
  name: 'CreativeQ competitors',
  totalMessages: 1,
  pinned: false,
  workSpaceId: WORKSPACE_ID,
  summaryEmittedAt: 0,
};

const sourcesValue = (sources: unknown[]) => ({
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Sources',
  type: MessageValueType.OUTPUT,
  value: sources,
  channels: {},
  createdAt: new Date('2026-08-16T20:42:02Z'),
  createdBy: 'System',
});

const messageWith = (value: unknown): Message => ({
  id: '512e3c54-cbd6-450a-b46f-29be1d49af50',
  createdAt: AT,
  createdBy: 'System',
  hasComments: false,
  messageThreadId: THREAD_ID,
  values: [
    {
      id: 'a6fe843e-ad88-4d5e-9aad-5cf45ae27735',
      name: 'Response',
      type: MessageValueType.OUTPUT,
      value,
      channels: {},
      createdAt: AT,
      createdBy: 'System',
    },
  ],
});

const renderResponse = (value: unknown) =>
  renderWithChat(<MessageList />, {
    workspaceId: WORKSPACE_ID,
    threadId: THREAD_ID,
    service: createFakeChatService({
      fetchMessages: async () => [messageWith(value)],
      fetchThread: async () => thread,
      fetchWorkspace: async () => workspace,
    }),
  });

const RESEARCH_PAYLOAD = {
  status: 'completed',
  company: { name: 'CreativeQ (Creative Q Limited)' },
  competitors: [{ rank: 1, name: 'Enlighten Designs' }],
};

/** Every rendered bubble carries the copy control, so its absence means no
 *  bubble was emitted at all — not merely an empty one. */
const BUBBLE = '[aria-label="Copy message content"]';

const settled = async (container: HTMLElement) =>
  waitFor(() =>
    expect(
      container.querySelector('[data-ss-layer="scroll-viewport"]')
    ).not.toBeNull()
  );

describe('structured Response rendering', () => {
  it('renders a schema-shaped Response object as a JSON block', async () => {
    const { container } = renderResponse(RESEARCH_PAYLOAD);

    await waitFor(() =>
      expect(container.querySelector('.ss-code-block')).not.toBeNull()
    );
    expect(container.querySelector('.ss-code-block')?.textContent).toContain(
      'Enlighten Designs'
    );
  });

  it('still unwraps a { content, sources } envelope as prose', async () => {
    const { container } = renderResponse({
      content: 'Here is the summary.',
      sources: [],
    });

    await waitFor(() =>
      expect(container.textContent).toContain('Here is the summary.')
    );
    expect(container.querySelector('.ss-code-block')).toBeNull();
  });

  // An early streaming frame can carry the envelope keys with nothing in
  // them; that must stay silent rather than painting `{}` into the thread.
  it('renders no bubble for an empty envelope frame', async () => {
    const { container } = renderResponse({ content: null, sources: null });

    await settled(container);
    expect(container.querySelector(BUBBLE)).toBeNull();
  });

  it('renders no bubble for a bare empty object', async () => {
    const { container } = renderResponse({});

    await settled(container);
    expect(container.querySelector(BUBBLE)).toBeNull();
  });

  it('still passes a directly-delivered content part through', async () => {
    const { container } = renderResponse({ text: 'Straight through.' });

    await waitFor(() =>
      expect(container.textContent).toContain('Straight through.')
    );
    expect(container.querySelector('.ss-code-block')).toBeNull();
  });

  // A payload carrying its own `sources` key is still structured output, not
  // an envelope — matching on the key alone unwrapped it to an undefined
  // `.content` and rendered the same blank turn this fix exists to stop.
  it('treats a structured payload carrying a sources key as data', async () => {
    const { container } = renderResponse({
      ...RESEARCH_PAYLOAD,
      sources: ['https://creativeq.co.nz', 'https://enlighten.co.nz'],
    });

    await waitFor(() =>
      expect(container.querySelector('.ss-code-block')).not.toBeNull()
    );
    expect(container.querySelector('.ss-code-block')?.textContent).toContain(
      'Enlighten Designs'
    );
  });

  const CITATIONS = [
    { index: 1, sourceType: 'URL', url: 'https://creativeq.co.nz' },
    { index: 2, sourceType: 'URL', url: 'https://enlighten.co.nz' },
  ];

  it('keeps citations on an envelope response', async () => {
    const { container } = renderResponse({
      content: 'Here is the summary.',
      sources: CITATIONS,
    });

    await waitFor(() => expect(container.textContent).toContain('Sources (2)'));
  });

  it('keeps citations on a content part carrying sources', async () => {
    const { container } = renderResponse({
      text: 'Here is the summary.',
      sources: CITATIONS,
    });

    await waitFor(() => expect(container.textContent).toContain('Sources (2)'));
  });

  // A structured payload's own `sources` field is data, not citations —
  // coercing it drops the ones a separate Sources output already collected.
  it('does not let a structured payload clobber the group citations', async () => {
    const message = messageWith({
      ...RESEARCH_PAYLOAD,
      sources: ['https://creativeq.co.nz'],
    });
    message.values = [sourcesValue(CITATIONS), ...(message.values ?? [])];

    const { container } = renderWithChat(<MessageList />, {
      workspaceId: WORKSPACE_ID,
      threadId: THREAD_ID,
      service: createFakeChatService({
        fetchMessages: async () => [message],
        fetchThread: async () => thread,
        fetchWorkspace: async () => workspace,
      }),
    });

    await waitFor(() => expect(container.textContent).toContain('Sources (2)'));
  });

  // The frame commit 91ca873 was written for: envelope keys, nothing filled
  // in yet. It must stay silent rather than fencing itself into the thread.
  it('renders no bubble for a partial streaming envelope frame', async () => {
    const { container } = renderResponse({
      messageId: 'abc',
      isReplying: true,
    });

    await settled(container);
    expect(container.querySelector(BUBBLE)).toBeNull();
    expect(container.querySelector('.ss-code-block')).toBeNull();
  });
});
