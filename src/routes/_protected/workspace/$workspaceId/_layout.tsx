// routes/_protected/workspace/$workspaceId/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Suspense, useEffect, type ReactNode } from 'react';

import { useUserDisplayName, useUserId } from '@/platform/auth/session';
import { defaultChatService } from '@/platform/chat/defaultChatService';
import {
  RouteIdsProvider,
  useRouteIds,
} from '@/platform/routing/RouteIdsProvider';

import { useDrainPendingThreadUsersOnSend } from '@/domains/thread-users';

import { PendingThreadsProvider } from '@/ui/threads/PendingThreadsContext';

import ChatBotPage from '@/pages/WorkspaceThreadPage/chat';

import { ChatProvider, workspaceDetailOptions } from '@smartspace/chat-ui';

/**
 * Exported for the integration test in `__tests__/ChatProviderBridge.spec.tsx`.
 * The route component is the only production consumer.
 */
export function ChatProviderBridge({ children }: { children: ReactNode }) {
  const { workspaceId, threadId } = useRouteIds();
  const userId = useUserId();
  const displayName = useUserDisplayName();
  return (
    <ChatProvider
      service={defaultChatService}
      workspaceId={workspaceId}
      threadId={threadId}
      identity={{ userId, displayName }}
    >
      {children}
    </ChatProvider>
  );
}

function DrainPendingThreadUsers() {
  useDrainPendingThreadUsersOnSend();
  return null;
}

function WorkspaceBodyBackground() {
  // Flat surface, no tag-driven gradient: the chat column paints its own
  // `bg-chat-area` and the rail is opaque, so the body just needs a base.
  useEffect(() => {
    const cls = ['bg-background'];
    document.body.classList.add(...cls);
    return () => {
      document.body.classList.remove(...cls);
    };
  }, []);

  return null;
}

export const Route = createFileRoute(
  '/_protected/workspace/$workspaceId/_layout'
)({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      workspaceDetailOptions({
        service: defaultChatService,
        workspaceId: params.workspaceId,
      })
    ),
  component: () => (
    <RouteIdsProvider>
      <ChatProviderBridge>
        <PendingThreadsProvider>
          <WorkspaceBodyBackground />
          <DrainPendingThreadUsers />
          <ChatBotPage />
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </PendingThreadsProvider>
      </ChatProviderBridge>
    </RouteIdsProvider>
  ),
});
