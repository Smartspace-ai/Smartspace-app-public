import type React from 'react';
import { createContext, useContext, useState } from 'react';
import { MessageThread } from '../models/message-threads';
import type { Workspace } from '../models/workspace';

// Update the context type to match the updated MessageThread class
type SmartSpaceChatContextType = {
  // UI state that isn't handled by React Query
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // User preferences
  userPreferences: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    autoSaveEnabled: boolean;
  };
  updateUserPreferences: (
    preferences: Partial<SmartSpaceChatContextType['userPreferences']>
  ) => void;

  // Any local-only functionality not tied to API
  localDrafts: Record<string, string>; // threadId -> draft message
  saveDraft: (threadId: string, content: string) => void;
  getDraft: (threadId: string) => string;
  clearDraft: (threadId: string) => void;

  // Workspace selection state (moved from WorkspaceSelectionProvider)
  activeWorkspace: Workspace | null;
  activeThread: MessageThread | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  setActiveThread: (thread: MessageThread | null) => void;
  setActiveWorkspaceId: (workspaceId: string | null) => void;
  setActiveThreadId: (threadId: string | null) => void;
};

// Create the context with a default value
const SmartSpaceChatContext = createContext<
  SmartSpaceChatContextType | undefined
>(undefined);

// Sample initial values
const initialUserPreferences = {
  notificationsEnabled: true,
  soundEnabled: true,
  autoSaveEnabled: true,
};

export const SmartSpaceChatProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // UI state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // User preferences
  const [userPreferences, setUserPreferences] = useState(
    initialUserPreferences
  );

  // Local drafts
  const [localDrafts, setLocalDrafts] = useState<Record<string, string>>({});

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null
  );
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Workspace selection state (moved from WorkspaceSelectionProvider)
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    null
  );
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Update user preferences
  const updateUserPreferences = (
    preferences: Partial<SmartSpaceChatContextType['userPreferences']>
  ) => {
    setUserPreferences((prev) => ({
      ...prev,
      ...preferences,
    }));
  };

  // Save draft message
  const saveDraft = (threadId: string, content: string) => {
    setLocalDrafts((prev) => ({
      ...prev,
      [threadId]: content,
    }));
  };

  // Get draft message
  const getDraft = (threadId: string) => {
    return localDrafts[threadId] || '';
  };

  // Clear draft message
  const clearDraft = (threadId: string) => {
    setLocalDrafts((prev) => {
      const newDrafts = { ...prev };
      delete newDrafts[threadId];
      return newDrafts;
    });
  };

  // Provide the context value
  const contextValue = {
    isDarkMode,
    toggleDarkMode,
    userPreferences,
    updateUserPreferences,
    localDrafts,
    saveDraft,
    getDraft,
    clearDraft,
    activeWorkspace,
    activeThread,
    setActiveWorkspace,
    setActiveThread: (thread: MessageThread | null) => {
      // Only update if the thread is different or if we're explicitly setting to null
      if (thread?.id !== activeThread?.id) {
        setActiveThread(thread);
      } else {
        // console.log(
        //   'SmartSpaceContext - Prevented redundant activeThread update'
        // );
      }
    },
    setActiveWorkspaceId,
    setActiveThreadId,
  };

  return (
    <SmartSpaceChatContext.Provider value={contextValue}>
      {children}
    </SmartSpaceChatContext.Provider>
  );
};

// Custom hook to use the context
export const useSmartSpaceChat = () => {
  const context = useContext(SmartSpaceChatContext);
  if (context === undefined) {
    throw new Error(
      'useSmartSpaceChat must be used within a SmartSpaceChatProvider'
    );
  }
  return context;
};

// Export both as named export and default export
export default useSmartSpaceChat;
