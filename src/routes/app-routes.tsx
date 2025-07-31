import { Route, Routes } from 'react-router-dom';
import ChatBotLayout from '../pages/chat-bot-layout/chat-bot-layout';
import { ChatBot } from '../pages/chat-bot/chat-bot';

export default function AppRoutes() {
  return (
    <Routes>

      {/* Chat routes with layout */}
      <Route element={<ChatBotLayout />}>
        {/* Specific route for thread */}
        <Route
          path="/workspace/:workspaceId/thread/:threadId"
          element={<ChatBot />}
        />
        {/* Route for workspace without thread */}
        <Route path="/workspace/:workspaceId" element={<ChatBot />} />
        {/* Route for root and any unmatched paths - shows ChatBot which handles no workspaces case */}
        <Route path="*" element={<ChatBot />} />
      </Route>
    </Routes>
  );
}
