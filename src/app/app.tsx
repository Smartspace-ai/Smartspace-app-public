// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styles from './app.module.scss';

import Chat from '../components/chat/chat';
import Sidebar from '../components/sidebar/sidebar';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div id="main" className="main flex ">
        <Sidebar></Sidebar>
        <Chat></Chat>
      </div>
    </QueryClientProvider>
  );
}

export default App;
