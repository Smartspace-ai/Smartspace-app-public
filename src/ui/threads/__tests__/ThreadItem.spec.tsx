import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MessageThread } from '@smartspace/chat-ui';

const goToThread = vi.fn();
const togglePin = vi.fn();
const remove = vi.fn();

vi.mock('@/ui/threads/ThreadItem.vm', () => ({
  useThreadItemVm: () => ({
    goToThread,
    togglePin,
    remove,
    isRunning: false,
    isSetPinPending: false,
  }),
}));

vi.mock('@/platform/routing/RouteIdsProvider', () => ({
  useRouteIds: () => ({ workspaceId: 'w1', threadId: 'other-thread' }),
}));

const { default: ThreadItem } = await import('@/ui/threads/ThreadItem');

const AT = new Date('2026-08-19T11:45:00Z');

const thread: MessageThread = {
  id: '9f2c7b41-5d8e-4a30-9c6f-1b2d3e4f5a60',
  createdAt: AT,
  createdBy: 'System',
  createdByUserId: '',
  isFlowRunning: false,
  lastUpdatedAt: AT,
  lastUpdatedByUserId: '',
  name: 'Quarterly reporting handover with a very long name indeed',
  totalMessages: 12,
  pinned: false,
  workSpaceId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  summaryEmittedAt: 0,
};

// The row hosts a rename dialog whose mutation needs a client, even closed.
const render = (ui: ReactElement) =>
  rtlRender(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        {children}
      </QueryClientProvider>
    ),
  });

const row = () => screen.getByRole('option');

describe('ThreadItem', () => {
  beforeEach(() => {
    goToThread.mockClear();
    togglePin.mockClear();
  });

  it('opens the thread from the row itself', () => {
    render(<ThreadItem thread={thread} />);

    fireEvent.pointerDown(row());
    expect(goToThread).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(row(), { key: 'Enter' });
    expect(goToThread).toHaveBeenCalledTimes(2);
  });

  it('ignores keys typed inside its own dialogs', () => {
    render(<ThreadItem thread={thread} />);

    // Radix portals the rename dialog out of this row in the DOM, but React
    // still routes its events up the React tree — so a Space typed into the
    // name field arrives here. Without the guard it was preventDefault'd out of
    // the input, and Enter opened the thread mid-rename. Any target that isn't
    // the row itself stands in for that case.
    const input = document.createElement('input');
    row().appendChild(input);

    const space = fireEvent.keyDown(input, { key: ' ' });
    expect(goToThread).not.toHaveBeenCalled();
    // Not consumed either: the keystroke is still the input's to handle.
    expect(space).toBe(true);

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(goToThread).not.toHaveBeenCalled();
  });

  it('does not navigate when a pointer lands on a row control', () => {
    render(<ThreadItem thread={thread} />);

    fireEvent.pointerDown(
      screen.getByRole('button', { name: 'Bookmark thread' })
    );
    expect(goToThread).not.toHaveBeenCalled();
  });

  it('gives the name the full row and the full text on hover', () => {
    const { container } = render(<ThreadItem thread={thread} />);

    // The actions float over the end of the row instead of taking a slot in it,
    // so the name is not cut off ~60px early to reserve room for buttons that
    // are invisible until hover.
    const title = container.querySelector('.chat-thread-title');
    expect(title?.getAttribute('title')).toBe(thread.name);
    expect(container.querySelector('.chat-thread-text')).not.toBeNull();
    expect(container.querySelector('.chat-thread-actions')).not.toBeNull();
  });

  it('holds the actions open while the row is pinned', () => {
    const { container, unmount } = render(<ThreadItem thread={thread} />);
    expect(row().getAttribute('data-actions-visible')).toBeNull();
    expect(container.querySelector('[data-actions-visible="true"]')).toBeNull();
    unmount();

    const pinned = render(<ThreadItem thread={{ ...thread, pinned: true }} />);
    expect(
      pinned.container.querySelector('[data-actions-visible="true"]')
    ).not.toBeNull();
  });
});
