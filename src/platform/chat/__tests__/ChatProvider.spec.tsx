import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  ChatProvider,
  useChatContext,
  useChatIdentity,
  useChatService,
} from '@/platform/chat';

import { createFakeChatService } from '@/test/chatProviderHarness';

describe('ChatProvider', () => {
  it('throws when useChatService is called outside a provider', () => {
    expect(() => renderHook(() => useChatService())).toThrow(
      /Chat hook used outside <ChatProvider>/
    );
  });

  it('throws when useChatContext is called outside a provider', () => {
    expect(() => renderHook(() => useChatContext())).toThrow(
      /Chat hook used outside <ChatProvider>/
    );
  });

  it('throws when useChatIdentity is called outside a provider', () => {
    expect(() => renderHook(() => useChatIdentity())).toThrow(
      /Chat hook used outside <ChatProvider>/
    );
  });

  it('memoizes the context value across re-renders when a fresh identity object is passed each time', () => {
    // Reproduces the ChatProviderBridge pattern: props are primitives, but
    // the identity object is a fresh literal every render.
    const service = createFakeChatService();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider
        service={service}
        workspaceId="w"
        threadId="t"
        identity={{ userId: 'u1', displayName: 'User One' }}
      >
        {children}
      </ChatProvider>
    );

    const { result, rerender } = renderHook(
      () => ({
        service: useChatService(),
        ctx: useChatContext(),
        id: useChatIdentity(),
      }),
      { wrapper }
    );

    const first = result.current;
    rerender();
    const second = result.current;

    expect(second.service).toBe(first.service);
    expect(second.ctx).toBe(first.ctx);
    expect(second.id).toBe(first.id);
  });

  it('invalidates the memo when identity primitives actually change', () => {
    const service = createFakeChatService();
    let userId = 'u1';
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider
        service={service}
        workspaceId="w"
        threadId="t"
        identity={{ userId, displayName: 'User One' }}
      >
        {children}
      </ChatProvider>
    );

    const { result, rerender } = renderHook(() => useChatIdentity(), {
      wrapper,
    });
    const first = result.current;
    userId = 'u2';
    rerender();
    expect(result.current.userId).toBe('u2');
    expect(result.current).not.toBe(first);
  });
});
