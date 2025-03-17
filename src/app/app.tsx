// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Chat from '../components/chat/chat';
import SidebarLeft from '../components/sidebar/sidebar-left/sidebar-left';
import SidebarRight from '../components/sidebar/sidebar-right/sidebar-right';
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar';
import { Toaster } from '../components/ui/sonner';
import { SmartSpaceContextProvider } from './contexts/smartspace-context';

const queryClient = new QueryClient();

export function App() {
  return (
    <SmartSpaceContextProvider>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <Layout />
        </SidebarProvider>
      </QueryClientProvider>
    </SmartSpaceContextProvider>
  );
}

function Layout() {
  return (
    <>
      <div className="flex h-screen w-full overflow-hidden">
        <SidebarLeft />
        <SidebarInset className="flex flex-col min-h-0">
          <Chat />
        </SidebarInset>
        <SidebarRight />
      </div>
      <Toaster />
    </>
  );
}

export default App;
