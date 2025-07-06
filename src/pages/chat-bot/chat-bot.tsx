import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Toaster } from 'sonner';
import Chat from '../../components/chat/chat';
import SidebarLeft from '../../components/sidebar/sidebar-left/sidebar-left';
import SidebarRight from '../../components/sidebar/sidebar-right/sidebar-right';
import { SidebarInset } from '../../components/ui/sidebar';
import { useSmartSpace } from '../../contexts/smartspace-context';
import { useWorkspaceMessages } from '../../hooks/use-workspace-messages';

export function ChatBot() {
  const {threadId, workspaceId} = useParams<{ threadId?: string; workspaceId?: string }>();
  const { activeWorkspace } = useSmartSpace();

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
