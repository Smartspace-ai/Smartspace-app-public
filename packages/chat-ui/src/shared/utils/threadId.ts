/** Synthetic id for the "New Thread" row in the thread list; links to thread/new route. */
export const NEW_THREAD_ID = '__new__';

/** Generate a GUID for a new thread (e.g. when sending first message from thread/new). */
export function createThreadId(): string {
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto | undefined })
    ?.crypto;
  return typeof cryptoObj?.randomUUID === 'function'
    ? cryptoObj.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const DRAFT_THREAD_PREFIX = 'draft-'; // legacy only (do not generate new ids with this prefix)
const DRAFT_THREAD_STORAGE_KEY = 'ss:draftThreadIds';

// In-memory + sessionStorage: which thread IDs are "drafts" (client-only until first message).
// Used so useThread/loaders skip fetch for drafts; route params + list cache hold the state.
const draftThreadIds = new Set<string>();
let hydratedFromStorage = false;

function isBrowserStorageAvailable() {
  try {
    return typeof window !== 'undefined' && !!window.sessionStorage;
  } catch {
    return false;
  }
}

function hydrateFromStorageOnce() {
  if (hydratedFromStorage) return;
  hydratedFromStorage = true;
  if (!isBrowserStorageAvailable()) return;

  try {
    const raw = window.sessionStorage.getItem(DRAFT_THREAD_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const id of parsed) {
      if (typeof id === 'string' && id) draftThreadIds.add(id);
    }
  } catch {
    // ignore
  }
}

function persistToStorage() {
  if (!isBrowserStorageAvailable()) return;
  try {
    window.sessionStorage.setItem(
      DRAFT_THREAD_STORAGE_KEY,
      JSON.stringify(Array.from(draftThreadIds))
    );
  } catch {
    // ignore
  }
}

export function markDraftThreadId(threadId: string) {
  if (!threadId) return;
  hydrateFromStorageOnce();
  draftThreadIds.add(threadId);
  persistToStorage();
}

export function unmarkDraftThreadId(threadId: string) {
  if (!threadId) return;
  hydrateFromStorageOnce();
  draftThreadIds.delete(threadId);
  persistToStorage();
}

export function isDraftThreadId(threadId?: string | null): boolean {
  if (!threadId) return false;
  // Backwards compatibility for any old routes/caches using prefixed ids.
  if (threadId.startsWith(DRAFT_THREAD_PREFIX)) return true;

  hydrateFromStorageOnce();
  return draftThreadIds.has(threadId);
}

export function createDraftThreadId(): string {
  // Must be a GUID-like string (no "draft-" prefix) so it can be safely used anywhere
  // a thread id is expected (including APIs that validate GUID format).
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto | undefined })
    ?.crypto;
  return typeof cryptoObj?.randomUUID === 'function'
    ? cryptoObj.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
