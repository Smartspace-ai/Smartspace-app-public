// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useState } from 'react';
import { Chat } from '../components/chat/chat';
import SidebarLeft from '../components/sidebar/sidebar-left/sidebar-left';
import SidebarRight from '../components/sidebar/sidebar-right/sidebar-right';
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar';
import { Toaster } from '../components/ui/sonner';
import { NotificationsProvider } from '../contexts/notifications-context';
import { SmartSpaceChatProvider } from '../contexts/smartspace-context';

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <SmartSpaceChatProvider>
        <NotificationsProvider>
          <SidebarProvider>
            <Layout />
          </SidebarProvider>
        </NotificationsProvider>
      </SmartSpaceChatProvider>
    </QueryClientProvider>
  );
}

function Layout() {
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

export default App;
