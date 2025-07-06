// SmartSpaceContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SortOrder } from '../enums/threads-sort-order';
import type { Workspace } from '../models/workspace';

type SmartSpaceContextType = {
  // UI
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Preferences
  userPreferences: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    autoSaveEnabled: boolean;
  };
  updateUserPreferences: (
    prefs: Partial<SmartSpaceContextType['userPreferences']>
  ) => void;

  // Workspace selection
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (ws: Workspace | null) => void;

  // Thread-list sorting
  sortOrder: SortOrder;
  setSortOrder: (o: SortOrder) => void;
};

const SmartSpaceContext = createContext<SmartSpaceContextType | undefined>(
  undefined
);

const initialUserPreferences = {
  notificationsEnabled: true,
  soundEnabled: true,
  autoSaveEnabled: true,
};

export const SmartSpaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => setIsDarkMode((d) => !d);

  // prefs
  const [userPreferences, setUserPreferences] = useState(
    initialUserPreferences
  );
  const updateUserPreferences = (prefs: Partial<typeof initialUserPreferences>) =>
    setUserPreferences((u) => ({ ...u, ...prefs }));

  // workspace
  const [activeWorkspace, setActiveWorkspace] =
    useState<Workspace | null>(null);

  // sort order, persisted
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

  return (
    <SmartSpaceContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        userPreferences,
        updateUserPreferences,
        activeWorkspace,
        setActiveWorkspace,
        sortOrder,
        setSortOrder,
      }}
    >
      {children}
    </SmartSpaceContext.Provider>
  );
};

export const useSmartSpace = (): SmartSpaceContextType => {
  const ctx = useContext(SmartSpaceContext);
  if (!ctx)
    throw new Error('useSmartSpace must be inside a SmartSpaceProvider');
  return ctx;
};
