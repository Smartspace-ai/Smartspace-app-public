// Re-export from the package so consumer + package share one in-memory Set
// of draft thread IDs. Owning local state here split detection across copies.
export {
  DRAFT_THREAD_PREFIX,
  NEW_THREAD_ID,
  createDraftThreadId,
  createThreadId,
  isDraftThreadId,
  markDraftThreadId,
  unmarkDraftThreadId,
} from '@smartspace/chat-ui';
