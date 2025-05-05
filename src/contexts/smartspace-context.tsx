import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { SortOrder } from '../enums/threads-sort-order';
import { MessageThread } from '../models/message-threads';
import type { Workspace } from '../models/workspace';

type SmartSpaceChatContextType = {
  // UI state
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

  // Local message drafts (per thread)
  localDrafts: Record<string, string>;
  saveDraft: (threadId: string, content: string) => void;
  getDraft: (threadId: string) => string;
  clearDraft: (threadId: string) => void;

  // Active selection state
  activeWorkspace: Workspace | null;
  activeThread: MessageThread | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  setActiveThread: (thread: MessageThread | null) => void;
  setActiveWorkspaceId: (workspaceId: string | null) => void;
  setActiveThreadId: (threadId: string | null) => void;

  // Thread sorting
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
};

// Context initialization
const SmartSpaceChatContext = createContext<
  SmartSpaceChatContextType | undefined
>(undefined);

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

  // Preferences and local drafts
  const [userPreferences, setUserPreferences] = useState(
    initialUserPreferences
  );
  const [localDrafts, setLocalDrafts] = useState<Record<string, string>>({});

  // Workspace/thread state
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null
  );
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    null
  );
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);

  // Thread sorting (with localStorage persistence)
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.NEWEST);

  useEffect(() => {
    const stored = localStorage.getItem('sortOrder');
    if (stored && Object.values(SortOrder).includes(stored as SortOrder)) {
      setSortOrder(stored as SortOrder);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sortOrder', sortOrder);
  }, [sortOrder]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const updateUserPreferences = (
    preferences: Partial<SmartSpaceChatContextType['userPreferences']>
  ) => {
    setUserPreferences((prev) => ({
      ...prev,
      ...preferences,
    }));
  };

  const saveDraft = (threadId: string, content: string) => {
    setLocalDrafts((prev) => ({
      ...prev,
      [threadId]: content,
    }));
  };

  const getDraft = (threadId: string) => {
    return localDrafts[threadId] || '';
  };

  const clearDraft = (threadId: string) => {
    setLocalDrafts((prev) => {
      const updated = { ...prev };
      delete updated[threadId];
      return updated;
    });
  };

  const contextValue: SmartSpaceChatContextType = {
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
      if (thread?.id !== activeThread?.id) {
        setActiveThread(thread);
      }
    },
    setActiveWorkspaceId,
    setActiveThreadId,
    sortOrder,
    setSortOrder,
  };

  return (
    <SmartSpaceChatContext.Provider value={contextValue}>
      {children}
    </SmartSpaceChatContext.Provider>
  );
};

// Hook to consume the context
export const useSmartSpaceChat = () => {
  const context = useContext(SmartSpaceChatContext);
  if (context === undefined) {
    throw new Error(
      'useSmartSpaceChat must be used within a SmartSpaceChatProvider'
    );
  }
  return context;
};

export default useSmartSpaceChat;
