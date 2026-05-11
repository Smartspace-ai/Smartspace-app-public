// routes/_protected/workspace/$workspaceId/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Suspense, useEffect, useMemo, type ReactNode } from 'react';

import { useUserDisplayName, useUserId } from '@/platform/auth/session';
import { defaultChatService } from '@/platform/chat/defaultChatService';
import {
  RouteIdsProvider,
  useRouteIds,
} from '@/platform/routing/RouteIdsProvider';

import { useDrainPendingThreadUsersOnSend } from '@/domains/thread-users';

import { PendingThreadsProvider } from '@/ui/threads/PendingThreadsContext';

import ChatBotPage from '@/pages/WorkspaceThreadPage/chat';

import { getBackgroundGradientClasses } from '@/theme/tag-styles';

import {
  useWorkspace,
  ChatProvider,
  workspaceDetailOptions,
} from '@smartspace/chat-ui';

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
  const { workspaceId } = useRouteIds();
  const { data: workspace } = useWorkspace(workspaceId);

  const gradientClasses = useMemo(() => {
    return getBackgroundGradientClasses({
      tags: workspace?.tags,
      name: workspace?.name,
    });
  }, [workspace?.tags, workspace?.name]);

  useEffect(() => {
    const base = [
      'bg-background',
      'bg-gradient-to-b',
      'from-background',
      'from-10%',
      'via-40%',
      'to-100%',
    ];
    const grad = (gradientClasses || '').split(/\s+/).filter(Boolean);
    const cls = [...base, ...grad];

    document.body.classList.add(...cls);
    return () => {
      document.body.classList.remove(...cls);
    };
  }, [gradientClasses]);

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
