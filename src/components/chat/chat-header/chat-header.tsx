import { MessageSquare, PanelLeft } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { useActiveWorkspace } from '@/hooks/use-workspaces';

 
import { useActiveThread } from '@/hooks/use-workspace-thread';
import { useWorkspaceUpdates } from '@/hooks/use-workspace-updates';
 
import { NotificationPanel } from '../../notifications/notifications-panel/notifications-panel';
import { Separator } from '../../ui/separator';
import { SidebarTrigger } from '../../ui/sidebar';

export function ChatHeader() {
  const { data: activeWorkspace } = useActiveWorkspace();
  const { data: activeThread } = useActiveThread();
  useWorkspaceUpdates()
  

  // Render all tags as chips; color-code safe/unsafe
  const tagChips = (() => {
    const tags = activeWorkspace?.tags || [];
    if (!tags.length) return null;
    return (
      <span className="ml-2 flex items-center gap-1 flex-wrap">
        {tags.map((t, i) => {
          const v = (t || '').toString();
          const l = v.toLowerCase();
          const cls = l === 'safe'
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
            : l === 'unsafe'
            ? 'bg-red-100 text-red-700 border-red-200'
            : 'bg-gray-100 text-gray-700 border-gray-200';
          return (
            <span key={`${v}-${i}`} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${cls}`}>
              {v}
            </span>
          );
        })}
      </span>
    );
  })();
  
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
            <span className="font-medium text-xs flex items-center">
              {activeWorkspace?.name}
              {tagChips}
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
