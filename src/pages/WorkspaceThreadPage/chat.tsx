// src/features/workspaces/Chat.tsx
import { Stack } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';

import { useWorkspaces } from '@/domains/workspaces/queries';
import SidebarRight from '@/ui/comments_draw/sidebar-right';
import ChatHeader from '@/ui/header/chat-header';
import SidebarLeft from '@/ui/layout/SideBarleft';
import MessageComposer from '@/ui/messages/MessageComposer';
import MessageList from '@/ui/messages/MessageList';
import { useRouteIds } from './RouteIdsProvider';

// ✅ the shared VM used by the sidebar ThreadsPanel
import { useThreadsListVm } from '@/ui/threads/ThreadsList.vm';

export default function ChatBotPage() {
  const { workspaceId, threadId } = useRouteIds();
  const navigate = useNavigate();
  // Workspaces list for initial workspace selection
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();

  // ✅ Shared threads VM (same cache/pagination as sidebar)
  const {
    firstThread,
    isInitialLoading: threadsInitialLoading,
  } = useThreadsListVm({ workspaceId, pageSize: 30 });

  // If no workspaceId in URL, select the first workspace after list loads
  useEffect(() => {
    if (workspaceId) return;
    if (!workspacesLoading && workspaces && workspaces.length > 0) {
      navigate({
        to: '/workspace/$workspaceId',
        params: { workspaceId: workspaces[0].id },
        replace: true,
      });
    }
  }, [workspaceId, workspacesLoading, workspaces, navigate]);

  // Handle thread auto-selection / creation once first page is ready
  const hasNavigatedRef = useRef(false);
  useEffect(() => {
    if (!workspaceId) {
      hasNavigatedRef.current = false;
      return;
    }

    // wait until the first page load settles to avoid race/flicker
    if (threadsInitialLoading) return;

    // only navigate once per workspace load
    if (hasNavigatedRef.current || threadId) return;

    hasNavigatedRef.current = true;

    if (firstThread) {
      // navigate to the first thread from the shared VM
      navigate({
        to: '/workspace/$workspaceId/thread/$threadId',
        params: { workspaceId, threadId: firstThread.id },
        replace: true,
      });
    } else {
      // no threads yet → create a new one client-side
      const newThreadId = crypto.randomUUID();
      navigate({
        to: '/workspace/$workspaceId/thread/$threadId',
        params: { workspaceId, threadId: newThreadId },
        replace: true,
      });
    }
  }, [workspaceId, threadId, firstThread, threadsInitialLoading, navigate]);

  return (
    <>
      <Stack direction="row" sx={{ height: '100dvh', width: '100vw', overflow: 'hidden', alignItems: 'stretch' }}>
        <SidebarLeft />
        {/* Middle column */}
        <Stack direction="column" sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <ChatHeader />
          <MessageList />
          <MessageComposer />
        </Stack>
        <SidebarRight />
      </Stack>
      <Toaster />
      </>
  );
}
