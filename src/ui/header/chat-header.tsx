import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import { MessageSquare, PanelLeft } from 'lucide-react';


 
 
import { useThread } from '@/domains/threads/queries';
import { useWorkspace } from '@/domains/workspaces/queries';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { SidebarTrigger } from '@/shared/ui/mui-compat/sidebar';

import { NotificationPanel } from './notifications-panel';





export function ChatHeader() {
  const { workspaceId, threadId } = useRouteIds();
  const { data: activeWorkspace, isPending: workspaceLoading, isError: workspaceError } = useWorkspace(workspaceId);
  const { data: activeThread } = useThread({ workspaceId, threadId });
  
  return (
    <header className="ss-chat__header flex h-[54px] shrink-0 items-center gap-2 bg-background border-b ">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger
          side="left"
          icon={<PanelLeft className="h-4 w-4" />}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        />
        <Divider orientation="vertical" className="mr-2 h-4" />
        {/* Workspace and thread display */}
        <div className="flex items-center">
          {workspaceError ? (
            <span
              className="font-medium text-xs text-destructive"
              role="status"
              aria-live="polite"
              title="Active workspace failed to load"
            >
              Workspace failed to load
            </span>
          ) : workspaceLoading ? (
            <Skeleton className="h-4 w-28" />
          ) : activeWorkspace ? (
            <span className="font-medium text-xs">
              {activeWorkspace?.name}
            </span>
          ) : (
            <span className="font-medium text-xs text-gray-500">—</span>
          )}
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
        <Divider orientation="vertical" className="h-4" />
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
