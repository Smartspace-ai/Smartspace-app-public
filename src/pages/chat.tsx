// src/features/workspaces/Chat.tsx
import { Stack } from '@mui/material';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';

import SidebarLeft from '@/components/sidebar/sidebar-left/sidebar-left';
import SidebarRight from '@/components/sidebar/sidebar-right/sidebar-right';
import { useThreads } from '@/domains/threads/queries';
import { useWorkspaces } from '@/domains/workspaces/queries';
import ChatHeader from '@/ui/header/chat-header';
import MessageComposer from '@/ui/messages/MessageComposer';
import MessageList from '@/ui/messages/MessageList';
import { RouteIdsProvider } from './WorkspaceThreadPage/RouteIdsProvider';
// Params: workspaceId is guaranteed (we are under that route); threadId is optional

export default function ChatBotPage() {
  // Pull params safely from the current matches
  const navigate = useNavigate()
  const workspaceMatch = useMatch({ from: '/_protected/workspace/$workspaceId', shouldThrow: false })
  const threadMatch = useMatch({ from: '/_protected/workspace/$workspaceId/thread/$threadId', shouldThrow: false })
  const threadId = threadMatch?.params?.threadId
  const workspaceId = workspaceMatch?.params?.workspaceId
  const { data:{ data: threads = []} = {}, isLoading: threadsLoading, isFetched: threadsFetched } = useThreads(workspaceId || "")
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces()

  // If no workspaceId in URL, select the first workspace after list loads
  useEffect(() => {
    if (workspaceId) return
    if (!workspacesLoading && workspaces && workspaces.length > 0) {
      navigate({
        to: '/workspace/$workspaceId',
        params: { workspaceId: workspaces[0].id },
        replace: true,
      })
    }
  }, [workspaceId, workspacesLoading, workspaces, navigate])

  // After threads load, auto-select the first thread if none is selected
  const hasAutoNavigatedRef = useRef(false)
  useEffect(() => {
    if (hasAutoNavigatedRef.current) return
    // Only act after the threads query has completed at least once
    if (!threadId && threadsFetched && !threadsLoading && threads && threads.length > 0 && workspaceId) {
      hasAutoNavigatedRef.current = true
      navigate({
        to: '/workspace/$workspaceId/thread/$threadId',
        params: { workspaceId, threadId: threads[0].id },
        replace: true,
      })
    }
  }, [threadId, threadsFetched, threadsLoading, threads, workspaceId, navigate])
  // No route redirects or early returns; child components handle loading/empty states

  // workspace page
  return (
    <RouteIdsProvider>
      <Stack direction="row" sx={{ height: '100dvh', width: '100vw', overflow: 'hidden', alignItems: 'stretch' }}>
        <SidebarLeft />
        {/* Middle column */}
        <Stack direction="column" sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <ChatHeader />
          <MessageList />
          <MessageComposer/>
        </Stack>
        <SidebarRight/>
      </Stack>
      <Toaster />
      </RouteIdsProvider>
  )
}
