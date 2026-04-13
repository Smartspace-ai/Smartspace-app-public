import React, { createContext, useContext, useMemo } from 'react';

import type { ChatService } from './ChatService';

export type ChatIdentity = {
  userId: string;
  displayName: string;
};

export type ChatContextIds = {
  workspaceId: string;
  /** Empty string when no thread is currently selected (e.g. draft state). */
  threadId: string;
};

type ChatProviderValue = {
  service: ChatService;
  ids: ChatContextIds;
  identity: ChatIdentity;
};

const ChatCtx = createContext<ChatProviderValue | null>(null);

export type ChatProviderProps = {
  service: ChatService;
  workspaceId: string;
  threadId: string;
  identity: ChatIdentity;
  children: React.ReactNode;
};

/**
 * Single point of injection for the chat UI subtree. Provides:
 *   - a `ChatService` implementation (backend port)
 *   - the current `{ workspaceId, threadId }` context
 *   - user identity used for optimistic message stamping
 *
 * All message UI components and message/file/thread/workspace hooks read
 * from this provider instead of reaching into platform auth or TanStack
 * Router directly — that is what makes the chat UI portable to a package.
 */
export function ChatProvider({
  service,
  workspaceId,
  threadId,
  identity,
  children,
}: ChatProviderProps) {
  const value = useMemo<ChatProviderValue>(
    () => ({
      service,
      ids: { workspaceId, threadId },
      identity: { userId: identity.userId, displayName: identity.displayName },
    }),
    // Depend on primitives, not the identity object reference — callers
    // commonly pass a fresh object literal each render (see ChatProviderBridge),
    // which would otherwise bust the memo and re-render every consumer.
    [service, workspaceId, threadId, identity.userId, identity.displayName]
  );
  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}

function useChatProviderValue(): ChatProviderValue {
  const ctx = useContext(ChatCtx);
  if (!ctx) {
    throw new Error(
      'Chat hook used outside <ChatProvider>. Wrap your tree in <ChatProvider>.'
    );
  }
  return ctx;
}

export function useChatService(): ChatService {
  return useChatProviderValue().service;
}

export function useChatContext(): ChatContextIds {
  return useChatProviderValue().ids;
}

export function useChatIdentity(): ChatIdentity {
  return useChatProviderValue().identity;
}
