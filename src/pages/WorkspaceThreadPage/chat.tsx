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
import { MessageList } from '@/ui/messages/MessageList';
import { useThreadsListVm } from '@/ui/threads/ThreadsList.vm';

import { useRouteIds } from './RouteIdsProvider';

// ✅ the shared VM used by the sidebar ThreadsPanel

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

  // Workspace selection is handled by the /workspace index route loader
  useEffect(() => {
    // no-op: route-level loader will redirect appropriately
  }, [workspaceId, workspacesLoading, workspaces, navigate]);

  // Handle thread auto-selection / creation once first page is ready
  const hasNavigatedRef = useRef(false);
  useEffect(() => {
    // Thread redirection is handled at route loader for $workspaceId
    hasNavigatedRef.current = false;
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
