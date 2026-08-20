import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { MessageThread } from '@smartspace/chat-ui';

const mutateAsync = vi.fn(async () => undefined);

vi.mock('@/domains/threads/mutations', () => ({
  useRenameThread: () => ({ mutateAsync, isPending: false }),
}));

const { ThreadRenameModal } = await import('@/ui/threads/ThreadRenameModal');

const AT = new Date('2026-08-19T11:45:00Z');

const thread: MessageThread = {
  id: '4e7a1c93-0b58-4d26-9f31-7a5c8e2d0b64',
  createdAt: AT,
  createdBy: 'System',
  createdByUserId: '',
  isFlowRunning: false,
  lastUpdatedAt: AT,
  lastUpdatedByUserId: '',
  name: 'hello',
  totalMessages: 1,
  pinned: false,
  workSpaceId: 'd5c4b3a2-1f0e-4d9c-8b7a-6e5f4d3c2b1a',
  summaryEmittedAt: 0,
};

const renderModal = (ui: ReactElement) =>
  render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        {children}
      </QueryClientProvider>
    ),
  });

describe('ThreadRenameModal', () => {
  it('accepts a name with spaces and saves it trimmed', async () => {
    mutateAsync.mockClear();
    const onClose = vi.fn();
    renderModal(<ThreadRenameModal isOpen onClose={onClose} thread={thread} />);

    const input = screen.getByLabelText('Thread Name');
    // The dialog never had a rule against spaces — the thread row behind it was
    // swallowing the keystroke. Typing one has to leave it in the value.
    fireEvent.change(input, { target: { value: '  hello there  ' } });
    expect((input as HTMLInputElement).value).toBe('  hello there  ');

    const save = screen.getByRole('button', { name: 'Save Changes' });
    expect((save as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(save);

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith('hello there')
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('keeps Save disabled for a blank name or an unchanged one', () => {
    renderModal(
      <ThreadRenameModal isOpen onClose={() => undefined} thread={thread} />
    );

    const save = () =>
      screen.getByRole('button', { name: 'Save Changes' }) as HTMLButtonElement;
    // Opens on the current name: nothing to save yet.
    expect(save().disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Thread Name'), {
      target: { value: '   ' },
    });
    expect(save().disabled).toBe(true);
  });
});
