import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
 * A new thread opens on the greeting, and until now that greeting said nothing
 * about the workspace the user just opened: the sidebar carries the name, and
 * the description (`summary` on the API) was mapped into the model but never
 * rendered anywhere in the app.
 *
 * NOTE: `@smartspace/chat-ui` resolves to the package's built `dist`, so run
 * `pnpm --filter @smartspace/chat-ui build` after editing its source or this
 * asserts against the previous build. CI is safe — install runs `prepare`.
 */

const WORKSPACE_ID = 'd0a4d0c6-0f0e-4f0a-9d54-5b2f5a1c9a11';
const THREAD_ID = '9f1a7b2c-6d3e-4a58-b0c7-2e5f8d4a1b33';
const AT = new Date('2026-08-25T09:15:00Z');

const workspaceWith = (
  fields: Partial<Pick<Workspace, 'summary' | 'firstPrompt'>>
) =>
  ({
    id: WORKSPACE_ID,
    name: 'Contract Review',
    tags: [],
    showSources: false,
    dataSpaces: [],
    favorited: false,
    summary: '',
    firstPrompt: '',
    variables: {},
    supportsFiles: false,
    avatarName: 'CR',
    ...fields,
  } as unknown as Workspace);

const thread: MessageThread = {
  id: THREAD_ID,
  createdAt: AT,
  createdBy: 'System',
  createdByUserId: '',
  isFlowRunning: false,
  lastUpdatedAt: AT,
  lastUpdatedByUserId: '',
  name: 'New thread',
  totalMessages: 0,
  pinned: false,
  workSpaceId: WORKSPACE_ID,
  summaryEmittedAt: 0,
};

const renderEmptyThread = (
  fields: Partial<Pick<Workspace, 'summary' | 'firstPrompt'>>
) =>
  renderWithChat(<MessageList />, {
    workspaceId: WORKSPACE_ID,
    threadId: THREAD_ID,
    service: createFakeChatService({
      fetchMessages: async () => [],
      fetchThread: async () => thread,
      fetchWorkspace: async () => workspaceWith(fields),
    }),
  });

const description = (container: HTMLElement) =>
  container.querySelector('[data-ss-layer="workspace-description"]');

const greeted = async (container: HTMLElement) =>
  waitFor(() => expect(container.textContent).toContain('on the agenda today'));

describe('new thread greeting', () => {
  it('shows the workspace description under the greeting', async () => {
    const { container } = renderEmptyThread({
      summary: 'Reviews supplier contracts against the standard clause set.',
    });

    await waitFor(() =>
      expect(container.textContent).toContain(
        'Reviews supplier contracts against the standard clause set.'
      )
    );
  });

  it('keeps the description above the first prompt', async () => {
    const { container } = renderEmptyThread({
      summary: 'Reviews supplier contracts.',
      firstPrompt: 'Paste a contract to begin.',
    });

    await waitFor(() =>
      expect(container.textContent).toContain('Paste a contract to begin.')
    );
    const text = container.textContent ?? '';
    expect(text.indexOf('Reviews supplier contracts.')).toBeLessThan(
      text.indexOf('Paste a contract to begin.')
    );
  });

  // The description is typed into an admin textarea, so its line breaks are
  // the author's paragraph breaks and each piece gets its own <p> to space
  // against — a single pre-wrapped block ran the sentences together.
  it('gives each line of the description its own paragraph', async () => {
    const { container } = renderEmptyThread({
      summary: 'Reviews supplier contracts.\n\nAsk in plain English.',
    });

    await waitFor(() => expect(description(container)).not.toBeNull());
    const paragraphs = description(container)?.querySelectorAll('p') ?? [];
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe('Reviews supplier contracts.');
    expect(paragraphs[1].textContent).toBe('Ask in plain English.');
  });

  // A workspace with no description configured must not open a blank line
  // between the greeting and the composer.
  it('renders nothing for a whitespace-only description', async () => {
    const { container } = renderEmptyThread({ summary: '   \n  ' });

    await greeted(container);
    expect(description(container)).toBeNull();
  });
});
