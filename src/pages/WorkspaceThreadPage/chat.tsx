// src/features/workspaces/Chat.tsx
import { Stack } from '@mui/material';
import { useMemo } from 'react';
import { Toaster } from 'sonner';

import { isInTeams } from '@/platform/auth/msalConfig';

import { useWorkspace, useWorkspaces } from '@/domains/workspaces';

import SidebarRightPanel from '@/ui/comments_draw/sidebar-right';
import ChatHeaderBar from '@/ui/header/chat-header';
import SidebarLeft from '@/ui/layout/SidebarLeft';
import { useThreadsListVm } from '@/ui/threads/ThreadsList.vm';

import { useSidebar } from '@/shared/ui/mui-compat/sidebar';

import { getBackgroundGradientClasses } from '@/theme/tag-styles';

import { MessageComposer, MessageList } from '@smartspace/chat-ui';

export default function ChatBotPage({
  workspaceId,
  threadId,
}: {
  workspaceId: string;
  threadId: string;
}) {
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const { data: activeWorkspace } = useWorkspace(workspaceId);
  const { leftOpen, rightOpen } = useSidebar();
  const { firstThread, isInitialLoading: threadsInitialLoading } =
    useThreadsListVm({
      workspaceId,
      pageSize: 30,
    });

  void workspacesLoading;
  void workspaces;
  void firstThread;
  void threadsInitialLoading;
  void threadId;

  const gradientClasses = useMemo(
    () =>
      getBackgroundGradientClasses({
        tags: activeWorkspace?.tags,
        name: activeWorkspace?.name,
      }),
    [activeWorkspace?.tags, activeWorkspace?.name]
  );

  return (
    <>
      <Stack
        direction="row"
        sx={{
          height: '100dvh',
          width: '100vw',
          overflow: 'hidden',
          alignItems: 'stretch',
        }}
      >
        <SidebarLeft />
        <Stack
          direction="column"
          data-ss-layer="chat-column"
          className={`bg-gradient-to-b from-background from-10% ${gradientClasses} via-40% to-100%`}
          sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
        >
          <ChatHeaderBar />
          <MessageList
            applyHostBackgroundOverride={isInTeams()}
            expandedLayout={leftOpen || rightOpen}
          />
          <MessageComposer expandedLayout={leftOpen || rightOpen} />
        </Stack>
        <SidebarRightPanel />
      </Stack>
      <Toaster />
    </>
  );
}
