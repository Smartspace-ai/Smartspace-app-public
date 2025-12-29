export const DRAFT_THREAD_PREFIX = 'draft-';

export function isDraftThreadId(threadId?: string | null): boolean {
  return !!threadId && threadId.startsWith(DRAFT_THREAD_PREFIX);
}


