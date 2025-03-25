'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

// Define the comment type
export type Comment = {
  id: number;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  content: string;
  timestamp: string;
};

// Update the Thread and Workspace types to match the API types
export type Thread = {
  id: number;
  workspaceId: number;
  title: string;
  avatar: string;
  replies: number;
  lastActivity: string;
  isFavorite: boolean;
};

export type Workspace = {
  id: number;
  name: string;
  color: string;
};

// Update the context type to match the updated Thread and Workspace types
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
  localDrafts: Record<number, string>; // threadId -> draft message
  saveDraft: (threadId: number, content: string) => void;
  getDraft: (threadId: number) => string;
  clearDraft: (threadId: number) => void;

  // Workspace selection state (moved from WorkspaceSelectionProvider)
  activeWorkspace: Workspace | null;
  activeThread: Thread | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  setActiveThread: (thread: Thread | null) => void;
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
  const [localDrafts, setLocalDrafts] = useState<Record<number, string>>({});

  // Workspace selection state (moved from WorkspaceSelectionProvider)
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    null
  );
  const [activeThread, setActiveThread] = useState<Thread | null>(null);

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
  const saveDraft = (threadId: number, content: string) => {
    setLocalDrafts((prev) => ({
      ...prev,
      [threadId]: content,
    }));
  };

  // Get draft message
  const getDraft = (threadId: number) => {
    return localDrafts[threadId] || '';
  };

  // Clear draft message
  const clearDraft = (threadId: number) => {
    setLocalDrafts((prev) => {
      const newDrafts = { ...prev };
      delete newDrafts[threadId];
      return newDrafts;
    });
  };

  // When workspace changes, clear the active thread if it doesn't belong to the new workspace
  useEffect(() => {
    if (
      activeThread &&
      activeWorkspace &&
      activeThread.workspaceId !== activeWorkspace.id
    ) {
      setActiveThread(null);
    }
  }, [activeWorkspace, activeThread]);

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
    setActiveThread,
  };

  return (
    <SmartSpaceChatContext.Provider value={contextValue}>
      {children}
    </SmartSpaceChatContext.Provider>
  );
};

// Custom hook to use the context
const useSmartSpaceChat = () => {
  const context = useContext(SmartSpaceChatContext);
  if (context === undefined) {
    throw new Error(
      'useSmartSpaceChat must be used within a SmartSpaceChatProvider'
    );
  }
  return context;
};

// Export both as named export and default export
export { useSmartSpaceChat };
export default useSmartSpaceChat;
