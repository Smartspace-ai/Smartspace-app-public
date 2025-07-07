import { useWorkspaceThread } from '@/hooks/use-workspace-thread';
import { useWorkspaces } from '@/hooks/use-workspaces';
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
  const { activeWorkspace } = useWorkspaces();

  // keep a list of the last 20 thread-IDs we've visited
  const [recentThreads, setRecentThreads] = useState<string[]>([]);
  const [visibleThread, setVisibleThread] = useState<string | null>(null);

  // Track loading state for current thread
  const { isLoading } = useWorkspaceMessages(activeWorkspace, threadId);

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
              <Chat threadId={threadId} />
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
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeThread || !threadId) return;

    const timeout = setTimeout(() => {
      // Re-check params inside the timeout to prevent stale navigation
      if (
        activeThread.workSpaceId !== workspaceId &&
        activeThread.id === threadId &&
        threadId === urlThreadId
      ) {
        navigate(`/workspace/${activeThread.workSpaceId}/thread/${activeThread.id}`);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [activeThread, workspaceId, threadId, navigate]);

  return null;
}