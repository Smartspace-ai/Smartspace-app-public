import type { Subject } from 'rxjs';

import type { FileInfo, FileScope } from '@/domains/files/model';
import type { Message, MessageContentItem } from '@/domains/messages/model';
import type { MessageThread } from '@/domains/threads/model';
import type { MentionUser, Workspace } from '@/domains/workspaces/model';

/**
 * Port / adapter interface for everything the chat UI needs from a backend.
 *
 * The production app provides `createDefaultChatService()` which hits the
 * `ChatApi` endpoints. A separate consumer repo (the sandbox debug harness)
 * will provide its own implementation backed by `ConfigApi.sandBox*` endpoints.
 *
 * This interface MUST remain the single contract between the chat UI and its
 * backend — no component in `src/ui/messages/` or hook in `src/domains/messages/`
 * should reach outside of this boundary.
 */
export interface ChatService {
  /** Fetch messages for a thread (paginated via take/skip). */
  fetchMessages(
    threadId: string,
    opts?: { take?: number; skip?: number }
  ): Promise<Message[]>;

  /**
   * Post a new user message. Returns a Subject synchronously so the caller
   * can subscribe before SSE chunks start arriving.
   */
  sendMessage(args: {
    workspaceId: string;
    threadId: string;
    contentList?: MessageContentItem[];
    files?: FileInfo[];
    variables?: Record<string, unknown>;
  }): Subject<Message>;

  /** Submit a structured input (e.g. form values) to an existing message. */
  addInputToMessage(args: {
    messageId: string;
    name: string;
    value: unknown;
    channels: Record<string, number> | null;
  }): Promise<Message>;

  uploadFiles(
    files: File[],
    scope: FileScope,
    onFileUploaded?: (file: File, fileInfo: FileInfo) => void,
    onChunkUploaded?: (
      chunkIndex: number,
      totalChunks: number,
      file: File
    ) => void
  ): Promise<FileInfo[]>;

  downloadFile(id: string, scope?: FileScope): Promise<Blob>;

  getFileInfo(id: string, scope: FileScope): Promise<FileInfo>;

  getFileDownloadUrl(sourceUri: string): Promise<string>;

  fetchThread(workspaceId: string, threadId: string): Promise<MessageThread>;

  fetchWorkspace(workspaceId: string): Promise<Workspace>;

  fetchTaggableUsers(workspaceId: string): Promise<MentionUser[]>;
}
