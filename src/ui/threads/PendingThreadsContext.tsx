import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { MessageThread } from '@/domains/threads';

type PendingThreadsContextValue = {
  pendingThreads: MessageThread[];
  addPendingThread: (t: MessageThread) => void;
  removePendingThread: (threadId: string) => void;
  updatePendingThread: (oldId: string, updates: Partial<MessageThread>) => void;
};

const PendingThreadsContext = createContext<PendingThreadsContextValue | null>(
  null
);

export function PendingThreadsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pendingThreads, setPendingThreads] = useState<MessageThread[]>([]);

  const addPendingThread = useCallback((t: MessageThread) => {
    setPendingThreads((prev) => {
      const exists = prev.some((p) => p.id === t.id);
      if (exists) return prev;
      return [t, ...prev];
    });
  }, []);

  const removePendingThread = useCallback((threadId: string) => {
    setPendingThreads((prev) => prev.filter((p) => p.id !== threadId));
  }, []);

  const updatePendingThread = useCallback(
    (oldId: string, updates: Partial<MessageThread>) => {
      setPendingThreads((prev) =>
        prev.map((p) => (p.id === oldId ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      pendingThreads,
      addPendingThread,
      removePendingThread,
      updatePendingThread,
    }),
    [pendingThreads, addPendingThread, removePendingThread, updatePendingThread]
  );

  return (
    <PendingThreadsContext.Provider value={value}>
      {children}
    </PendingThreadsContext.Provider>
  );
}

export function usePendingThreads(): PendingThreadsContextValue {
  const ctx = useContext(PendingThreadsContext);
  if (!ctx) {
    throw new Error(
      'usePendingThreads must be used within PendingThreadsProvider.'
    );
  }
  return ctx;
}
