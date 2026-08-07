// src/features/workspaces/Chat.tsx
import { Stack } from '@mui/material';
import { useMatch } from '@tanstack/react-router';
import { Toaster } from 'sonner';

import { isInTeams } from '@/platform/auth/msalConfig';
import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import SidebarRightPanel from '@/ui/comments_draw/sidebar-right';
import ChatHeaderBar from '@/ui/header/chat-header';
import SidebarLeft from '@/ui/layout/SidebarLeft';

import { useSidebar } from '@/shared/ui/mui-compat/sidebar';

import { MessageComposer, MessageList } from '@smartspace/chat-ui';

export default function ChatBotPage() {
  const { workspaceId, threadId } = useRouteIds();
  const { leftOpen, rightOpen } = useSidebar();
  // While the route loader is redirecting from /workspace/$workspaceId/ to
  // its first thread, MessageList shouldn't show "no messages yet" — pass
  // the indicator explicitly so the package stays router-agnostic.
  const workspaceIndexMatch = useMatch({
    from: '/_protected/workspace/$workspaceId/_layout/',
    shouldThrow: false,
  });

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
          className="chat-main"
          sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
        >
          <ChatHeaderBar />
          <MessageList
            applyHostBackgroundOverride={isInTeams()}
            expandedLayout={leftOpen || rightOpen}
            isChoosingThread={
              !!workspaceId && !threadId && !!workspaceIndexMatch
            }
          />
          <MessageComposer expandedLayout={leftOpen || rightOpen} />
        </Stack>
        <SidebarRightPanel />
      </Stack>
      <Toaster />
    </>
  );
}
