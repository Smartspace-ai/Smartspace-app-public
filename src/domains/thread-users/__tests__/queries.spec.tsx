import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { useThreadUsers } from '@/domains/thread-users/queries';

import {
  DRAFT_THREAD_PREFIX,
  markDraftThreadId,
  unmarkDraftThreadId,
} from '@/shared/utils/threadId';


function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, client };
}

describe('useThreadUsers enabled gate', () => {
  it('returns empty array immediately and does not fetch when threadId is null', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useThreadUsers(null), { wrapper });

    expect(result.current.data).toEqual([]);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns empty array immediately and does not fetch for draft thread IDs', () => {
    const { wrapper } = makeWrapper();
    const draftId = `${DRAFT_THREAD_PREFIX}test-draft`;
    markDraftThreadId(draftId);
    const { result } = renderHook(() => useThreadUsers(draftId), { wrapper });

    unmarkDraftThreadId(draftId);

    expect(result.current.data).toEqual([]);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('enables the query for a real thread ID', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useThreadUsers('real-thread-id'), {
      wrapper,
    });

    // Query is enabled — it will attempt to fetch (fetchStatus is not idle).
    expect(result.current.fetchStatus).not.toBe('idle');
  });
});
