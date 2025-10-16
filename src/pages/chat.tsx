// src/features/workspaces/Chat.tsx
import { Stack } from '@mui/material';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';

import Chat from '@/components/chat/chat';
import SidebarLeft from '@/components/sidebar/sidebar-left/sidebar-left';
import SidebarRight from '@/components/sidebar/sidebar-right/sidebar-right';
import { useTeamsViewport } from '@/hooks/use-teams-viewport';
import { useWorkspaceThreads } from '@/hooks/use-workspace-threads';
import { useWorkspaces } from '@/hooks/use-workspaces';
// Params: workspaceId is guaranteed (we are under that route); threadId is optional

export default function ChatBotPage() {
  // Pull params safely from the current matches
  const navigate = useNavigate()
  const workspaceMatch = useMatch({ from: '/_protected/workspace/$workspaceId', shouldThrow: false })
  const threadMatch = useMatch({ from: '/_protected/workspace/$workspaceId/thread/$threadId', shouldThrow: false })
  const threadId = threadMatch?.params?.threadId
  const workspaceId = workspaceMatch?.params?.workspaceId
  const { threads, isLoading: threadsLoading, isFetched: threadsFetched } = useWorkspaceThreads()
  const { workspaces, isLoading: workspacesLoading } = useWorkspaces()
  const { viewportHeight, isAndroidTeams } = useTeamsViewport()

  // If no workspaceId in URL, select the first workspace after list loads
  useEffect(() => {
    if (workspaceId) return
    if (!workspacesLoading && workspaces && (workspaces.length ?? 0) > 0) {
      navigate({
        to: '/workspace/$workspaceId',
        params: { workspaceId: workspaces[0]?.id },
        replace: true,
      })
    }
  }, [workspaceId, workspacesLoading, workspaces, navigate])

  // Handle thread selection and auto-generation in one place to prevent flicker
  const hasNavigatedRef = useRef(false)
  useEffect(() => {
    
    // Only proceed if we have a workspace and no thread selected and haven't navigated yet
    if (!threadId && workspaceId && threadsFetched && !threadsLoading && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true
      
      if (threads && threads.length > 0) {
        navigate({
          to: '/workspace/$workspaceId/thread/$threadId',
          params: { workspaceId, threadId: threads[0].id },
          replace: true,
        })
      } else if (threads && threads.length === 0) {
        const newThreadId = crypto.randomUUID();
        navigate({
          to: '/workspace/$workspaceId/thread/$threadId',
          params: { workspaceId, threadId: newThreadId },
          replace: true,
        })
      }
    }
    
    // Reset navigation flag when workspace changes
    if (hasNavigatedRef.current && !workspaceId) {
      hasNavigatedRef.current = false
    }
  }, [threadId, workspaceId, threads, threadsFetched, threadsLoading, navigate])
  // No route redirects or early returns; child components handle loading/empty states

  // workspace page
  return (
    <>
      <Stack 
        direction="row" 
        sx={{ 
          height: viewportHeight, 
          width: '100vw', 
          overflow: 'hidden', 
          alignItems: 'stretch',
          // Additional Android Teams specific styling
          ...(isAndroidTeams && {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          })
        }}
      >
        <SidebarLeft />
        {/* Middle column */}
        <Stack direction="column" sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <Chat threadId={threadId} isVisible />
        </Stack>
        <SidebarRight threadId={threadId} />
      </Stack>
      <Toaster />
    </>
  )
}
