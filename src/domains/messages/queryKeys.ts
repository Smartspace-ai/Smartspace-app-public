// src/domains/messages/queryKeys.ts
export const messagesKeys = {
    all: ['messages'] as const,
  
    lists: () => [...messagesKeys.all, 'list'] as const,
    list: (threadId: string) => [...messagesKeys.lists(), { threadId }] as const,
  
    details: () => [...messagesKeys.all, 'detail'] as const,
    detail: (messageId: string) => [...messagesKeys.details(), { messageId }] as const,
  
    infinite: (threadId: string) => [...messagesKeys.lists(), 'infinite', { threadId }] as const,
  };
  