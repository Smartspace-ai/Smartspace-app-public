import {
  downloadFile as filesDownloadFile,
  getFileDownloadUrl as filesGetFileDownloadUrl,
  getFileInfo as filesGetFileInfo,
  uploadFiles as filesUploadFiles,
} from '@/domains/files/service';
import {
  addInputToMessage as messagesAddInputToMessage,
  fetchMessages as messagesFetchMessages,
  postMessage as messagesPostMessage,
} from '@/domains/messages/service';
import { fetchThread as threadsFetchThread } from '@/domains/threads/service';
import {
  fetchTaggableUsers as workspacesFetchTaggableUsers,
  fetchWorkspace as workspacesFetchWorkspace,
} from '@/domains/workspaces/service';

import type { ChatService } from './ChatService';

/**
 * Factory for the default `ChatService` — a thin adapter that delegates each
 * method to the canonical implementation in `src/domains/*\/service.ts`. The
 * service files own:
 *   - SDK schema coercion (null `createdByUserId`, null `channels`, file-upload
 *     user-id fields)
 *   - SSE streaming via `fetch` + `parseSseStream`
 *   - bearer-token-aware fetch wiring (no axios error objects to scrub)
 *
 * Keeping this layer mechanical means the npm-package extraction story stays
 * easy (this file is what gets replaced for the sandbox repo) while the
 * production app reuses one implementation.
 */
export function createDefaultChatService(): ChatService {
  return {
    fetchMessages: (threadId, opts) => messagesFetchMessages(threadId, opts),

    sendMessage: ({ workspaceId, threadId, contentList, files, variables }) =>
      messagesPostMessage({
        workSpaceId: workspaceId,
        threadId,
        contentList,
        files,
        variables,
      }),

    addInputToMessage: (args) => messagesAddInputToMessage(args),

    uploadFiles: (files, scope, onFileUploaded, onChunkUploaded) =>
      filesUploadFiles(files, scope, onFileUploaded, onChunkUploaded),

    downloadFile: (id, scope) => filesDownloadFile(id, scope),

    getFileInfo: (id, scope) => filesGetFileInfo(id, scope),

    getFileDownloadUrl: (sourceUri) => filesGetFileDownloadUrl(sourceUri),

    fetchThread: (workspaceId, threadId) =>
      threadsFetchThread(workspaceId, threadId),

    fetchWorkspace: (workspaceId) => workspacesFetchWorkspace(workspaceId),

    fetchTaggableUsers: (workspaceId) =>
      workspacesFetchTaggableUsers(workspaceId),
  };
}

/**
 * Module-load singleton for app-level use.
 *
 * The underlying domain services lazily call `ChatApi.getSmartSpaceChatAPI()`
 * at their own module-load — importing this file transitively initializes the
 * SDK. Tests that want to mock the SDK should call `createDefaultChatService()`
 * after their mocks are in place rather than importing `defaultChatService`.
 */
export const defaultChatService: ChatService = createDefaultChatService();
