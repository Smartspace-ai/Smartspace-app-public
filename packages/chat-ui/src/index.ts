// Public API surface of @smartspace/chat-ui.

// UI components — what the consumer renders inside <ChatProvider>.
export { MessageComposer, MessageList, MessageListSkeleton } from './messages';
export type { MessageListProps } from './messages/MessageList';
export type { MessageComposerProps } from './messages/MessageComposer';

// Workspace variables form (used inside MessageComposer; also exported so
// consumers can render it standalone if needed).
export { ChatVariablesForm } from './chat-variables/VariablesForm';

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
