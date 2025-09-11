import { MessageSquare, PanelLeft } from 'lucide-react';

import { useActiveWorkspace } from '@/hooks/use-workspaces';
import { Skeleton } from '@/shared/ui/skeleton';

 
import { useActiveThread } from '@/hooks/use-workspace-thread';
import { useWorkspaceUpdates } from '@/hooks/use-workspace-updates';
 
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';
import { NotificationPanel } from '../../components/notifications/notifications-panel/notifications-panel';
import { Separator } from '../../shared/ui/separator';
import { SidebarTrigger } from '../../shared/ui/sidebar';

export function ChatHeader() {
  const { workspaceId, threadId } = useRouteIds();
  const { data: activeWorkspace } = useActiveWorkspace();
  const { data: activeThread } = useActiveThread();
  useWorkspaceUpdates()

  
  return (
    <header className="ss-chat__header flex h-[54px] shrink-0 items-center gap-2 bg-background border-b ">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger
          side="left"
          icon={<PanelLeft className="h-4 w-4" />}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {/* Workspace and thread display */}
        <div className="flex items-center">
          {activeWorkspace?
            <span className="font-medium text-xs">
              {activeWorkspace?.name}
            </span>
            :
            <Skeleton className="h-4 w-28" />
          }
          {activeThread?.name && (
            <>
              <span className="mx-2 text-gray-400">/</span>
              <span
                className="text-xs font-medium text-neutral-500 truncate max-w-[240px]"
                title={activeThread.name}
                key={`thread-title-${activeThread.id}`} // Force re-render when thread changes
              >
                {activeThread.name}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4">
        <NotificationPanel />
        <Separator orientation="vertical" className="h-4" />
        <SidebarTrigger
          side="right"
          icon={<MessageSquare className="h-4 w-4" />}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        />
      </div>
      
    </header>
  );
}

export default ChatHeader;
