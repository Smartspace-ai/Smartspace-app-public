// src/features/workspaces/Chat.tsx
import { Stack } from '@mui/material';
import { useMemo } from 'react';
import { Toaster } from 'sonner';

import { useWorkspace, useWorkspaces } from '@/domains/workspaces/queries';

import SidebarRightPanel from '@/ui/comments_draw/sidebar-right';
import ChatHeaderBar from '@/ui/header/chat-header';
import SidebarLeft from '@/ui/layout/SidebarLeft';
import MessageComposer from '@/ui/messages/MessageComposer';
import { MessageList } from '@/ui/messages/MessageList';
import { useThreadsListVm } from '@/ui/threads/ThreadsList.vm';

import { getBackgroundGradientClasses } from '@/theme/tag-styles';

// ✅ the shared VM used by the sidebar ThreadsPanel

export default function ChatBotPage({
  workspaceId,
  threadId,
}: {
  workspaceId: string;
  threadId: string;
}) {
  // Workspaces list for initial workspace selection
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const { data: activeWorkspace } = useWorkspace(workspaceId);

  // ✅ Shared threads VM (same cache/pagination as sidebar)
  const {
    firstThread,
    isInitialLoading: threadsInitialLoading,
  } = useThreadsListVm({ workspaceId, pageSize: 30 });

  // Note: routing/redirects are handled in route loaders, not here.
  void workspacesLoading;
  void workspaces;
  void firstThread;
  void threadsInitialLoading;
  void threadId;

  const gradientClasses = useMemo(() => {
    return getBackgroundGradientClasses({
      tags: activeWorkspace?.tags,
      name: activeWorkspace?.name,
    });
  }, [activeWorkspace?.tags, activeWorkspace?.name]);

  return (
    <>
      <Stack direction="row" sx={{ height: '100dvh', width: '100vw', overflow: 'hidden', alignItems: 'stretch' }}>
        <SidebarLeft />
        {/* Middle column */}
        <Stack
          direction="column"
          data-ss-layer="chat-column"
          className={`bg-gradient-to-b from-background from-10% ${gradientClasses} via-40% to-100%`}
          sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
        >
          <ChatHeaderBar />
          <MessageList />
          <MessageComposer />
        </Stack>
        <SidebarRightPanel />
      </Stack>
      <Toaster />
      </>
  );
}
