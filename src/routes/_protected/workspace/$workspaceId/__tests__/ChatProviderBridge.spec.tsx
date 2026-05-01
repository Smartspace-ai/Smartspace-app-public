import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { mockUseRouteIds, mockUseUserId, mockUseUserDisplayName } = vi.hoisted(
  () => ({
    mockUseRouteIds: vi.fn(),
    mockUseUserId: vi.fn(),
    mockUseUserDisplayName: vi.fn(),
  })
);

vi.mock('@/platform/routing/RouteIdsProvider', () => ({
  useRouteIds: mockUseRouteIds,
  RouteIdsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/platform/auth/session', () => ({
  useUserId: mockUseUserId,
  useUserDisplayName: mockUseUserDisplayName,
}));

import {
  useChatContext,
  useChatIdentity,
  useChatService,
} from '@/platform/chat';

import { ChatProviderBridge } from '../_layout';

function Probe({
  onRender,
}: {
  onRender: (snapshot: {
    service: ReturnType<typeof useChatService>;
    ids: ReturnType<typeof useChatContext>;
    identity: ReturnType<typeof useChatIdentity>;
  }) => void;
}) {
  const service = useChatService();
  const ids = useChatContext();
  const identity = useChatIdentity();
  onRender({ service, ids, identity });
  return null;
}

describe('ChatProviderBridge', () => {
  it('forwards ids + identity from route/auth hooks into the chat context', () => {
    mockUseRouteIds.mockReturnValue({ workspaceId: 'w1', threadId: 't1' });
    mockUseUserId.mockReturnValue('user-1');
    mockUseUserDisplayName.mockReturnValue('Alice');

    const snapshots: Array<{
      ids: { workspaceId: string; threadId: string };
      identity: { userId: string; displayName: string };
    }> = [];

    render(
      <ChatProviderBridge>
        <Probe onRender={(s) => snapshots.push(s)} />
      </ChatProviderBridge>
    );

    expect(snapshots[0].ids).toEqual({ workspaceId: 'w1', threadId: 't1' });
    expect(snapshots[0].identity).toEqual({
      userId: 'user-1',
      displayName: 'Alice',
    });
    // The default service singleton is provided.
    expect(typeof snapshots[0].service.fetchMessages).toBe('function');
  });

  it('keeps identity reference stable across re-renders when underlying values do not change', () => {
    mockUseRouteIds.mockReturnValue({ workspaceId: 'w1', threadId: 't1' });
    mockUseUserId.mockReturnValue('user-1');
    mockUseUserDisplayName.mockReturnValue('Alice');

    const snapshots: Array<{
      identity: { userId: string; displayName: string };
    }> = [];

    const { rerender } = render(
      <ChatProviderBridge>
        <Probe onRender={(s) => snapshots.push(s)} />
      </ChatProviderBridge>
    );
    rerender(
      <ChatProviderBridge>
        <Probe onRender={(s) => snapshots.push(s)} />
      </ChatProviderBridge>
    );

    // ChatProviderBridge passes a fresh `identity` object literal each render;
    // ChatProvider's memo-on-primitives must keep the resulting context value
    // stable so consumers don't re-render unnecessarily.
    expect(snapshots[0].identity).toBe(snapshots[1].identity);
  });
});
