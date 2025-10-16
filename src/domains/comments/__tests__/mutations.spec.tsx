import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useAddComment } from '@/domains/comments/mutations';
import { commentsKeys } from '@/domains/comments/queryKeys';
import * as service from '@/domains/comments/service';

vi.mock('@/platform/auth/session', () => ({
  useUserId: () => 'me-id',
}));

describe('comments mutations', () => {
  it('useAddComment adds optimistic then replaces with real', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const real = {
      id: 'c-real', content: 'hello', createdAt: new Date('2024-01-01'), createdBy: 'me-id', createdByUserId: 'me-id', mentionedUsers: [], messageThreadId: 't1',
    } as any;
    const spy = vi.spyOn(service, 'addComment').mockResolvedValueOnce(real);

    const { result } = renderHook(() => useAddComment('t1'), { wrapper });
    await result.current.mutateAsync({ threadId: 't1', content: 'hello', mentionedUsers: [] });

    const data = client.getQueryData<any[]>(commentsKeys.list('t1')) || [];
    expect(data.find((x) => x.id === 'c-real')).toBeTruthy();
    expect(data.find((x) => String(x.id).startsWith('temp-'))).toBeFalsy();
    spy.mockRestore();
  });
});


