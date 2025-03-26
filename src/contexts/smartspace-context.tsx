import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
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

  // When workspace changes, clear the active thread if it doesn't belong to the new workspace
  useEffect(() => {
    console.log(
      'Checking thread-workspace relationship:',
      'Thread:',
      activeThread?.name,
      'Thread ID:',
      activeThread?.id,
      'Workspace:',
      activeWorkspace?.name,
      'Workspace ID:',
      activeWorkspace?.id
    );

    // Check if we need to clear the thread when workspace changes
    if (activeThread && activeWorkspace) {
      // Get the thread's workspace ID from the thread object or from a related property
      // Since we don't have a direct workspaceId property, we need to check if the thread
      // belongs to the current workspace in a different way

      // Option 1: If threads are fetched per workspace, we can assume any active thread
      // from a previous workspace should be cleared when workspace changes
      const previousWorkspaceId = activeThread.messageThreadId?.split('-')[0];
      const threadWorkspaceId = previousWorkspaceId || null;

      console.log(
        'Thread workspace check:',
        'Thread workspace ID:',
        threadWorkspaceId,
        'Current workspace ID:',
        activeWorkspace.id
      );

      if (threadWorkspaceId && threadWorkspaceId !== activeWorkspace.id) {
        console.log('Clearing active thread - belongs to different workspace');
        setActiveThread(null);
      }
    }
  }, [activeWorkspace]); // Only run when workspace changes, not when thread changes

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
      console.log(
        'SmartSpaceContext BEFORE setting activeThread:',
        activeThread?.name,
        'ID:',
        activeThread?.id,
        'TO:',
        thread?.name,
        'ID:',
        thread?.id
      );

      // Only update if the thread is different or if we're explicitly setting to null
      if (thread?.id !== activeThread?.id) {
        setActiveThread(thread);
        console.log(
          'SmartSpaceContext AFTER setting activeThread:',
          thread?.name,
          'ID:',
          thread?.id
        );
      } else {
        console.log(
          'SmartSpaceContext - Prevented redundant activeThread update'
        );
      }
    },
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
