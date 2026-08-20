import { screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  createFakeChatService,
  renderWithChat,
} from '@/test/chatProviderHarness';
import { MessageComposer, type Workspace } from '@smartspace/chat-ui';

/**
 * The composer used to reserve a blank second line above its action bar: the
 * reference's 76px textarea block carries its own controls, and matching that
 * number here left dead space over a bar that, on a workspace with no
 * variables, holds nothing but the send buttons.
 *
 * NOTE: `@smartspace/chat-ui` resolves to the package's built `dist`, so run
 * `pnpm --filter @smartspace/chat-ui build` after editing its source or this
 * asserts against the previous build. CI is safe — install runs `prepare`.
 */

const WORKSPACE_ID = 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b';
const THREAD_ID = 'b9c8d7e6-f5a4-4b3c-9d1e-0f9a8b7c6d5e';

/** One line of the composer's `text-sm`, and no more. */
const ONE_LINE = '24px';

const workspaceWith = (variables: Record<string, unknown>) =>
  ({
    id: WORKSPACE_ID,
    name: 'Ops',
    tags: [],
    showSources: false,
    dataSpaces: [],
    favorited: false,
    summary: '',
    firstPrompt: '',
    variables,
    supportsFiles: false,
    avatarName: 'Ops',
  } as unknown as Workspace);

beforeAll(() => {
  // Milkdown reads the reduced-motion preference on mount; jsdom has no
  // matchMedia.
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

const renderComposer = (variables: Record<string, unknown> = {}) =>
  renderWithChat(<MessageComposer />, {
    workspaceId: WORKSPACE_ID,
    threadId: THREAD_ID,
    service: createFakeChatService({
      fetchMessages: async () => [],
      fetchWorkspace: async () => workspaceWith(variables),
      fetchFlowRunVariables: async () => ({}),
      fetchModels: async () => ({ data: [], total: 0 }),
    }),
  });

describe('composer height', () => {
  it('starts at one line rather than holding a blank one open', async () => {
    const { container } = renderComposer();

    const editor = await waitFor(() => {
      const el = container.querySelector('[role="textbox"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });

    expect(editor.style.getPropertyValue('--md-min-height')).toBe(ONE_LINE);
  });

  it('puts nothing in the action bar when the workspace has no variables', async () => {
    const { container } = renderComposer();

    await waitFor(() =>
      expect(container.querySelector('.ss-composer__actions')).not.toBeNull()
    );
    const actions = container.querySelector(
      '.ss-composer__actions'
    ) as HTMLElement;
    expect(actions.querySelector('.jsonforms-compact')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Variables \(/ })).toBeNull();
  });
});
