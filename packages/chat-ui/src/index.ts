// Public API surface of @smartspace/chat-ui.

// UI components — what the consumer renders inside <ChatProvider>.
export { MessageComposer, MessageList, MessageListSkeleton } from './messages';
export type { MessageListProps } from './messages/MessageList';
export type { MessageComposerProps } from './messages/MessageComposer';

// Workspace variables form (used inside MessageComposer; also exported so
// consumers can render it standalone if needed).
export { ChatVariablesForm } from './chat-variables/VariablesForm';

// Markdown editor + renderer — also used by the comments-draw in the standalone
// fork, so exported as part of the public surface.
export { MarkdownEditor } from './shared/markdown/MarkdownEditor';
export type { MarkdownEditorHandle } from './shared/markdown/MarkdownEditor';
export { MessageMarkdown } from './shared/markdown/MessageMarkdown';

// Port — ChatService interface + provider + hooks.
export type { ChatService } from './platform/chat/ChatService';
export {
  ChatProvider,
  useChatContext,
  useChatIdentity,
  useChatService,
} from './platform/chat/ChatProvider';
export type {
  ChatContextIds,
  ChatIdentity,
  ChatProviderProps,
} from './platform/chat/ChatProvider';

// Domain types consumers need to write a custom ChatService implementation.
export type {
  Message,
  MessageContentItem,
  MessageValue,
} from './domains/messages/model';
export { MessageValueType } from './domains/messages/enums';
export type { FileInfo, FileScope } from './domains/files/model';
export type { MessageThread, ThreadsResponse } from './domains/threads/model';
export type {
  MentionUser,
  Variables,
  Workspace,
} from './domains/workspaces/model';
export type { FlowRunVariables } from './domains/flowruns/model';
export type { Model, ModelProperty } from './domains/models/model';
export { getModelIcon } from './domains/models/model-icon';

// Mappers + schemas — exported so app-side ChatService implementations and
// SSE handlers can reuse the same DTO ↔ model conversion the package's UI
// uses. Internal package code prefers @/domains/*/mapper for shorter paths.
export {
  applyDeltaToMessage,
  mapMessageDtoToModel,
  mapMessageErrorDtoToModel,
  mapMessageValueDtoToModel,
  mapMessagesDtoToModels,
  type MessageError,
} from './domains/messages/mapper';
// Error/status text helpers — exported so forks can override copy and tests
// can pin the error-code contract with the backend.
export {
  getMessageErrorText,
  type MessageErrorLike,
} from './domains/messages/errors';
export {
  getRetryStatusText,
  parseRetryStatus,
  type RetryStatus,
} from './domains/messages/statuses';
export { mapFileInfoDtoToModel } from './domains/files/mapper';
export {
  mapSignalRThreadSummaryToModel,
  mapThreadDtoToModel,
  mapThreadsResponseDtoToModel,
} from './domains/threads/mapper';
export {
  mapMentionUserDtoToModel,
  mapWorkspaceDtoToModel,
  mapWorkspacesDtoToModels,
} from './domains/workspaces/mapper';

// Cache helpers consumers may need for cross-domain cache surgery.
export {
  applyThreadToCache,
  invalidateWorkspaceThreadLists,
  setThreadOptimisticRunning,
  setThreadRunningInLists,
} from './domains/threads/cache';

// Single canonical module — duplicate copies split the in-memory Set and
// break draft detection across consumer/package boundaries.
export {
  DRAFT_THREAD_PREFIX,
  NEW_THREAD_ID,
  createDraftThreadId,
  createThreadId,
  isDraftThreadId,
  markDraftThreadId,
  unmarkDraftThreadId,
} from './shared/utils/threadId';

// Safe crypto.randomUUID() wrapper with environment fallback.
export { randomUUID } from './shared/utils/randomUUID';

// Date + photo helpers consumers reuse for app-side mappers/schemas/UI.
export { DateFromApi, utcDate } from './shared/utils/dateFromApi';
export {
  parseDateTime,
  parseDateTimeHuman,
} from './shared/utils/parseDateTime';
export { getUserPhotoUrl } from './shared/utils/userPhoto';

// Query keys consumers may need to invalidate or seed cache.
export {
  messagesKeys,
  messagesMutationsKeys,
} from './domains/messages/queryKeys';
export { filesKeys } from './domains/files/queryKeys';
export {
  threadsKeys,
  THREAD_LIST_PAGE_SIZE,
} from './domains/threads/queryKeys';
export { workspaceKeys } from './domains/workspaces/queryKeys';
export { flowRunsKeys } from './domains/flowruns/queryKeys';
export { modelsKeys } from './domains/models/queryKeys';

// Domain hook surface (chat-side queries/mutations).
export { useMessages, messagesListOptions } from './domains/messages/queries';
export {
  useSendMessage,
  useAddInputToMessage,
} from './domains/messages/mutations';
export { useFileMutations } from './domains/files/mutations';
export {
  useDownloadFileBlobQuery,
  downloadFileBlobOptions,
} from './domains/files/queries';
export {
  threadDetailOptions,
  useThread,
  useThreadIsRunning,
  getThreadPlaceholderFromListCache,
} from './domains/threads/queries';
export {
  useWorkspace,
  workspaceDetailOptions,
  useTaggableWorkspaceUsers,
  taggableUsersOptions,
} from './domains/workspaces/queries';
export { useFlowRunVariables } from './domains/flowruns/queries';
export { useUpdateFlowRunVariable } from './domains/flowruns/mutations';
export { useModels } from './domains/models/queries';
