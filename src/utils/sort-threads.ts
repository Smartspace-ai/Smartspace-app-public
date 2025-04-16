import { MessageThread } from '@/models/message-threads';
import { SortOrder } from '../enums/threads-sort-order';

export function sortThreads(
  threads: MessageThread[],
  sortOrder: SortOrder
): MessageThread[] {
  return [...threads].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return (
          new Date(b.lastUpdatedAt || b.createdAt).getTime() -
          new Date(a.lastUpdatedAt || a.createdAt).getTime()
        );
      case 'oldest':
        return (
          new Date(a.lastUpdatedAt || a.createdAt).getTime() -
          new Date(b.lastUpdatedAt || b.createdAt).getTime()
        );
      case 'mostReplies':
        return (b.totalMessages || 0) - (a.totalMessages || 0);
      default:
        return 0;
    }
  });
}
