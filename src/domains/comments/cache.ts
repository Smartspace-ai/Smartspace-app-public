import type { SignalR } from '@smartspace/api-client';
import type { QueryClient } from '@tanstack/react-query';

import { mapSignalRCommentSummaryToModel } from './mapper';
import type { Comment } from './model';
import { commentsKeys } from './queryKeys';

/**
 * Splice a freshly-observed comment (from SignalR `receiveCommentsUpdate`)
 * straight into the comments list cache for its thread. Replaces an existing
 * entry by id, otherwise appends and re-sorts by `createdAt`. Returns `true`
 * when the cache had a list to patch — callers can fall back to invalidating
 * if it returns `false` (e.g. the user has never opened the comments panel
 * for this thread).
 */
export function applyCommentToCache(
  qc: QueryClient,
  summary: SignalR.CommentSummary
): boolean {
  const mapped = mapSignalRCommentSummaryToModel(summary);
  const listKey = commentsKeys.list(summary.messageThreadId);
  let applied = false;
  qc.setQueryData<Comment[]>(listKey, (old) => {
    if (!old) return old;
    applied = true;
    const idx = old.findIndex((c) => c.id === summary.id);
    if (idx === -1) {
      return [...old, mapped].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
    }
    const copy = old.slice();
    copy[idx] = mapped;
    return copy;
  });
  return applied;
}
