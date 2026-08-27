// src/ui/workspaces/threadEvents.ts
import type { QueryClient } from '@tanstack/react-query';

import {
  invalidateWorkspaceThreadLists,
  messagesKeys,
  threadsKeys,
} from '@smartspace/chat-ui';

/**
 * Thread events are invalidation signals, not data. New backends send an
 * id-only ThreadEvent ({ workSpaceId, threadId }); older ones still send a
 * full MessageThreadSummary ({ id, ... }). Both shapes are handled
 * permanently — deployed installs can lag this bundle, or this bundle can
 * lag the backend, by weeks in either direction.
 *
 * Invalidate rather than merge: the broadcast goes to the whole workspace
 * SignalR group, so per-viewer fields in a legacy payload (favorited) are
 * only correct for whoever triggered the event. The per-user HTTP refetch
 * is the truth for every viewer.
 */
export type ThreadEventPayload = { threadId?: string; id?: string };

export function threadIdFromEvent(
  payload: ThreadEventPayload
): string | undefined {
  return payload.threadId ?? payload.id;
}

export function handleThreadUpdate(
  qc: QueryClient,
  workspaceId: string,
  viewedThreadId: string,
  payload: ThreadEventPayload
): void {
  const eventThreadId = threadIdFromEvent(payload);
  // Malformed payload: no-op — never fall back to invalidating every cache.
  if (!eventThreadId) return;

  // The detail refetch is the isFlowRunning safety net: the broadcast fires
  // after the run lock is released, so it lands `isFlowRunning: false` even
  // when the SSE never delivered its terminal thread frame.
  qc.invalidateQueries({
    queryKey: threadsKeys.detail(workspaceId, eventThreadId),
  });

  // Without a payload there is nothing to splice into the list cache, so the
  // sidebar refetches on every thread event. Only active observers refetch.
  invalidateWorkspaceThreadLists(qc, workspaceId);

  // Refetch the messages list so other-tab activity surfaces — but only for
  // threads the user is NOT currently viewing. The viewed thread is fed by
  // its own SSE (snapshot + deltas + terminal frame) which is already
  // authoritative; invalidating its cache here races a server fetch against
  // the SSE's final state and produces a visible flicker the moment the
  // flow finishes.
  if (eventThreadId !== viewedThreadId) {
    qc.invalidateQueries({ queryKey: messagesKeys.list(eventThreadId) });
  }
}

/**
 * Invalidates the thread list and reports whether the deleted thread is the
 * one currently being viewed (the caller navigates away if so).
 */
export function handleThreadDeleted(
  qc: QueryClient,
  workspaceId: string,
  viewedThreadId: string,
  payload: ThreadEventPayload
): boolean {
  invalidateWorkspaceThreadLists(qc, workspaceId);
  const eventThreadId = threadIdFromEvent(payload);
  // Truthy check on both sides: an empty-string id must never read as a
  // match (e.g. a malformed payload while on a non-thread route).
  return !!eventThreadId && eventThreadId === viewedThreadId;
}
