import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { messagesKeys, threadsKeys } from '@smartspace/chat-ui';

import {
  handleThreadDeleted,
  handleThreadUpdate,
  threadIdFromEvent,
} from '../threadEvents';

function makeQc() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
  return { qc, invalidateSpy };
}

describe('threadIdFromEvent', () => {
  it('prefers the id-only ThreadEvent shape', () => {
    expect(threadIdFromEvent({ threadId: 't-new', id: 't-old' })).toBe('t-new');
  });

  it('falls back to the legacy summary id', () => {
    expect(threadIdFromEvent({ id: 't-old' })).toBe('t-old');
  });

  it('returns undefined for a malformed payload', () => {
    expect(threadIdFromEvent({})).toBeUndefined();
  });
});

describe('handleThreadUpdate', () => {
  it('invalidates detail, lists, and the unviewed thread messages', () => {
    const { qc, invalidateSpy } = makeQc();

    handleThreadUpdate(qc, 'ws-1', 'viewed-thread', {
      threadId: 'other-thread',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: threadsKeys.detail('ws-1', 'other-thread'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: messagesKeys.list('other-thread'),
    });
    // Sidebar lists are invalidated via the shared helper, which matches by
    // predicate on this workspace's thread-list keys.
    const predicateCall = invalidateSpy.mock.calls.find(
      ([args]) => typeof args?.predicate === 'function'
    );
    expect(predicateCall).toBeDefined();
    const predicate = predicateCall![0]!.predicate!;
    expect(
      predicate({
        queryKey: ['threads', 'list', { workspaceId: 'ws-1' }],
      } as never)
    ).toBe(true);
    expect(
      predicate({
        queryKey: ['threads', 'list', { workspaceId: 'ws-other' }],
      } as never)
    ).toBe(false);
  });

  it('skips the messages invalidation for the currently viewed thread', () => {
    const { qc, invalidateSpy } = makeQc();

    handleThreadUpdate(qc, 'ws-1', 'viewed-thread', { id: 'viewed-thread' });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: threadsKeys.detail('ws-1', 'viewed-thread'),
    });
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: messagesKeys.list('viewed-thread'),
    });
    // The sidebar lists still refetch even when the messages skip applies.
    expect(
      invalidateSpy.mock.calls.some(
        ([args]) => typeof args?.predicate === 'function'
      )
    ).toBe(true);
  });

  it('accepts the legacy summary payload shape', () => {
    const { qc, invalidateSpy } = makeQc();

    handleThreadUpdate(qc, 'ws-1', '', {
      id: 'legacy-thread',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: threadsKeys.detail('ws-1', 'legacy-thread'),
    });
  });

  it('no-ops entirely on a malformed payload', () => {
    const { qc, invalidateSpy } = makeQc();

    handleThreadUpdate(qc, 'ws-1', 'viewed-thread', {});

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('handleThreadDeleted', () => {
  it('invalidates the thread list and reports a match on the viewed thread', () => {
    const { qc, invalidateSpy } = makeQc();

    const shouldNavigate = handleThreadDeleted(qc, 'ws-1', 'viewed-thread', {
      threadId: 'viewed-thread',
    });

    expect(shouldNavigate).toBe(true);
    const predicateCall = invalidateSpy.mock.calls.find(
      ([args]) => typeof args?.predicate === 'function'
    );
    expect(predicateCall).toBeDefined();
    expect(
      predicateCall![0]!.predicate!({
        queryKey: ['threads', 'list', { workspaceId: 'ws-1' }],
      } as never)
    ).toBe(true);
  });

  it('reports no match for other threads and legacy payloads elsewhere', () => {
    const { qc } = makeQc();

    expect(
      handleThreadDeleted(qc, 'ws-1', 'viewed-thread', { id: 'other' })
    ).toBe(false);
    // Malformed payload must not navigate the user away.
    expect(handleThreadDeleted(qc, 'ws-1', 'viewed-thread', {})).toBe(false);
    // Empty viewed-thread id (non-thread route) never matches — including
    // against a legacy payload carrying an empty id.
    expect(handleThreadDeleted(qc, 'ws-1', '', {})).toBe(false);
    expect(handleThreadDeleted(qc, 'ws-1', '', { id: '' })).toBe(false);
    expect(handleThreadDeleted(qc, 'ws-1', '', { threadId: '' })).toBe(false);
  });
});
