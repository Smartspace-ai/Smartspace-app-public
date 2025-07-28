import { useWorkspaceThread } from '@/hooks/use-workspace-thread';
import { useActiveWorkspace, useWorkspaces } from '@/hooks/use-workspaces';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Toaster } from 'sonner';
import Chat from '../../components/chat/chat';
import SidebarLeft from '../../components/sidebar/sidebar-left/sidebar-left';
import SidebarRight from '../../components/sidebar/sidebar-right/sidebar-right';
import { SidebarInset } from '../../components/ui/sidebar';
import { useWorkspaceMessages } from '../../hooks/use-workspace-messages';
  
export function ChatBot() {
  const { threadId } = useParams<{ threadId?: string }>();
  const { data: activeWorkspace } = useActiveWorkspace();
  const { workspaces, isLoading: workspacesLoading } = useWorkspaces();

  // keep a list of the last 20 thread-IDs we've visited
  const [recentThreads, setRecentThreads] = useState<string[]>([]);
  const [visibleThread, setVisibleThread] = useState<string | null>(null);

  // Track loading state for current thread
  const { isLoading } = useWorkspaceMessages(activeWorkspace?.id, threadId);

  useEffect(() => {
    if (!threadId) return;

    setRecentThreads((prev) => {
      const filtered = prev.filter((id) => id !== threadId);
      const updated = [threadId, ...filtered];
      return updated.slice(0, 20);
    });
  }, [threadId]);

  // Only show thread when it's loaded
  useEffect(() => {
    if (threadId && !isLoading) {
      setTimeout(() => {
        setVisibleThread(threadId);
      }, 50);
    }
  }, [threadId, isLoading]);

  // Show no workspaces message when user has no workspaces
  if (!workspacesLoading && workspaces.length === 0) {
    return (
      <>
        <SidebarLeft />
        <SidebarInset className="relative flex-1 flex flex-col min-h-0">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div style={{
              maxWidth: '500px',
              textAlign: 'center',
              background: 'white',
              padding: '40px',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '16px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                No Workspaces Available
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#718096',
                lineHeight: '1.6',
                marginBottom: '24px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                It looks like you don't have access to any workspaces yet. Please contact your administrator to get access to a workspace.
              </p>
            </div>
          </div>
        </SidebarInset>
        <SidebarRight threadId={threadId} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <SidebarLeft />
      {recentThreads.map((threadId) => (
        <div key={`thread-${threadId}`} className="ss-chat__wrapper flex h-screen w-full overflow-hidden" 
          style={{
            display: threadId === visibleThread ? undefined : 'none',
          }}>
          { threadId === visibleThread && <EnsureCorrectWorkspace threadId={threadId} /> }
          <SidebarInset className="relative flex-1 flex flex-col min-h-0">
            <div className="absolute inset-0">
              <Chat threadId={threadId} isVisible={threadId === visibleThread} />
            </div>
          </SidebarInset>
          <SidebarRight threadId={threadId} />
        </div>
      ))}
      <Toaster />
    </>
  );
}


function EnsureCorrectWorkspace({ threadId }: { threadId?: string }) {
  const { workspaceId, threadId: urlThreadId } = useParams<{ workspaceId?: string; threadId?: string }>();
  const { data: activeThread } = useWorkspaceThread({ workspaceId, threadId });
  const { error: activeWorkspaceError } = useActiveWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Re-check params inside the timeout to prevent stale navigation
      if (
        activeThread && threadId &&
        activeThread.workSpaceId !== workspaceId &&
        activeThread.id === threadId &&
        threadId === urlThreadId
      ) {
        navigate(`/workspace/${activeThread.workSpaceId}/thread/${activeThread.id}`);
      } else if (activeWorkspaceError) {
        navigate('/');
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [activeThread, workspaceId, threadId, navigate, activeWorkspaceError]);

  return null;
}