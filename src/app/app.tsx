// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styles from './app.module.scss';

import Chat from '../components/chat/chat';
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar';
import MainSidebar from '../components/sidebar/main-sidebar';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <MainSidebar></MainSidebar>
        <SidebarInset>
          <Chat></Chat>
        </SidebarInset>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;
