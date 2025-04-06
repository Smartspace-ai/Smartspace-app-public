import { Toaster } from 'sonner';
import Chat from '../../components/chat/chat';
import SidebarLeft from '../../components/sidebar/sidebar-left/sidebar-left';
import SidebarRight from '../../components/sidebar/sidebar-right/sidebar-right';
import { SidebarInset } from '../../components/ui/sidebar';

export function ChatBot() {
  return (
    <>
      <div className="ss-chat__wrapper flex h-screen w-full overflow-hidden">
        <SidebarLeft />
        <SidebarInset className="flex flex-col min-h-0">
          <Chat key="chat" />
        </SidebarInset>
        <SidebarRight />
      </div>
      <Toaster />
    </>
  );
}

export default ChatBot;
