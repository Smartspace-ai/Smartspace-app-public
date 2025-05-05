import { Route, Routes } from 'react-router-dom';
import ChatBotLayout from '../pages/chat-bot-layout/chat-bot-layout';
import ChatBot from '../pages/chat-bot/chat-bot';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Redirect from "/" to "/workspaces" */}
      <Route path="/" element={<ChatBotLayout />} />

      {/* Chat routes with layout */}
      <Route element={<ChatBotLayout />}>
        {/* Specific route for thread */}
        <Route
          path="/workspace/:workspaceId/thread/:threadId"
          element={<ChatBot />}
        />
        {/* Route for workspace without thread */}
        <Route path="/workspace/:workspaceId" element={<ChatBot />} />
      </Route>
    </Routes>
  );
}
