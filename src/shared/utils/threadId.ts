export const DRAFT_THREAD_PREFIX = 'draft-'; // legacy only (do not generate new ids with this prefix)
const DRAFT_THREAD_STORAGE_KEY = 'ss:draftThreadIds';

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
  return typeof globalThis !== 'undefined' &&
    // @ts-expect-error - crypto is not in lib dom for some TS configs
    globalThis.crypto &&
    // @ts-expect-error - randomUUID may not exist in all envs
    typeof globalThis.crypto.randomUUID === 'function'
      ? // @ts-expect-error - randomUUID may not exist in all envs
        globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


