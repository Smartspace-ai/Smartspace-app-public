import { Bell, MessageSquare } from 'lucide-react';

import { useSmartSpaceChat } from '../../../app/contexts/smartspace-context';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '../../ui/breadcrumb';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { SidebarTrigger } from '../../ui/sidebar';

export function ChatHeader() {
  const { activeThread } = useSmartSpaceChat();

  return (
    <div className="chat__header">
      <div className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background">
        <div className="flex flex-1 items-center gap-2 px-3 justify-between">
          <div className="chat__header_breadcrumb">
            <div className="flex items-center gap-2">
              <SidebarTrigger side="left" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      {activeThread
                        ? activeThread.title
                        : 'Please select a thread'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          <div className="chat__header_actions">
            <div className="flex items-center gap-2 px-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-primary"></span>
                <span className="sr-only">Notifications</span>
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <SidebarTrigger
                side="right"
                icon={<MessageSquare className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;
