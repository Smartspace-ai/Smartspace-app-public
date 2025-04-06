import { Bell, MessageSquare, PanelLeft } from 'lucide-react';

import { useSmartSpaceChat } from '../../../contexts/smartspace-context';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { SidebarTrigger } from '../../ui/sidebar';

export function ChatHeader() {
  const { activeWorkspace, activeThread } = useSmartSpaceChat();

  return (
    <header className="ss-chat__header flex h-[55px] shrink-0 items-center gap-2 bg-background border-b shadow">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger
          side="left"
          icon={<PanelLeft className="h-4 w-4" />}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {/* Workspace and thread display */}
        <div className="flex items-center">
          <span className="font-medium text-sm">
            {activeWorkspace?.name || 'Workspace'}
          </span>
          {activeThread && (
            <>
              <span className="mx-2 text-gray-400">/</span>
              <span
                className="text-sm font-medium text-neutral-500 truncate max-w-[300px]"
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 flex h-1.5 w-1.5 bg-primary rounded-full"></span>
          <span className="sr-only">Notifications</span>
        </Button>
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
