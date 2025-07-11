import { MessageSquare, PanelLeft } from 'lucide-react';

import { WorkspaceSelector } from '@/components/sidebar/workspace-selector/workspace-selector';
import { useWorkspaceThread } from '@/hooks/use-workspace-thread';
import { useActiveWorkspace } from '@/hooks/use-workspaces';
import { useParams } from 'react-router-dom';
import { NotificationPanel } from '../../notifications/notifications-panel/notifications-panel';
import { Separator } from '../../ui/separator';
import { SidebarTrigger } from '../../ui/sidebar';

export function ChatHeader() {
  const activeWorkspace = useActiveWorkspace();
  const {threadId} = useParams<{ threadId?: string }>();

  const {data: activeThread } = useWorkspaceThread({
    workspaceId: activeWorkspace?.id,
    threadId,
  });

  return (
    <header className="ss-chat__header flex h-[54px] shrink-0 items-center gap-2 bg-background border-b ">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger
          side="left"
          icon={<PanelLeft className="h-4 w-4" />}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        />
        {/* Workspace and thread display */}
        <div className="flex w-full items-center">
          <WorkspaceSelector />
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
