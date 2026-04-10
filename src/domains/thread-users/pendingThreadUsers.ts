/**
 * Tracks user IDs that should be added to a thread the next time a message is
 * sent on it. Used for draft (client-only) threads where the membership API
 * cannot be called yet because the thread doesn't exist server-side.
 */
const pending = new Map<string, Set<string>>();
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function getPendingThreadUsers(threadId: string): string[] {
  return Array.from(pending.get(threadId) ?? []);
}

export function setPendingThreadUsers(
  threadId: string,
  userIds: string[]
): void {
  if (userIds.length === 0) {
    pending.delete(threadId);
  } else {
    pending.set(threadId, new Set(userIds));
  }
  emit();
}

export function clearPendingThreadUsers(threadId: string): void {
  if (pending.delete(threadId)) emit();
}

export function subscribePendingThreadUsers(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
