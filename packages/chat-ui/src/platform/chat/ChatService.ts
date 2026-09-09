import type { FileInfo, FileScope } from '@/domains/files/model';
import type { FlowRunVariables } from '@/domains/flowruns/model';
import type { Message, MessageContentItem } from '@/domains/messages/model';
import type { Model } from '@/domains/models/model';
import type { SpeechConfig, SpeechToken } from '@/domains/speech/model';
import type { MessageThread } from '@/domains/threads/model';
import type { MentionUser, Workspace } from '@/domains/workspaces/model';

/**
 * Port / adapter interface for everything the chat UI needs from a backend.
 *
 * The production app provides `createDefaultChatService()` which delegates to
 * the `ChatApi`-backed implementations in `src/domains/*\/service.ts`. A
 * separate consumer repo (the sandbox debug harness) will provide its own
 * implementation backed by `ConfigApi.sandBox*` endpoints.
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
   * Post a new user message. Returns the server-authoritative initial Message
   * (id, inputs populated). Output deltas arrive via the thread SSE keyed by
   * the returned id — callers should reconcile their optimistic temp-id entry
   * with this response.
   */
  sendMessage(args: {
    workspaceId: string;
    threadId: string;
    contentList?: MessageContentItem[];
    files?: FileInfo[];
    variables?: Record<string, unknown>;
  }): Promise<Message>;

  /**
   * Submit a structured input (e.g. form values) to an existing message. The
   * server streams `IAsyncEnumerable<Message>`; the last successfully parsed
   * frame is returned.
   */
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

  /**
   * Read the current flow-run variable set for a thread. Used by the chat
   * variables form to seed initial values.
   */
  fetchFlowRunVariables(flowRunId: string): Promise<FlowRunVariables>;

  /**
   * Patch a single flow-run variable. The chat variables form calls this on
   * each change to keep the running flow's variable state in sync.
   */
  updateFlowRunVariable(args: {
    flowRunId: string;
    name: string;
    value: unknown;
  }): Promise<void>;

  /**
   * List models the user has access to. Drives the model-id renderer in the
   * variables form (a dropdown of selectable models).
   */
  fetchModels(opts?: {
    search?: string;
    take?: number;
    skip?: number;
  }): Promise<{ data: Model[]; total: number }>;

  /**
   * Request cancellation of the thread's running flow (the thread id IS the
   * flow-run id). Cancellation is cooperative: the engine stops between block
   * executions, typically within seconds, and the terminal SSE frame clears
   * `isFlowRunning`. Optional so existing service implementations keep
   * compiling — the composer only shows a Stop button when it is provided.
   */
  cancelFlowRun?(flowRunId: string): Promise<void>;

  /**
   * Speech-to-text (composer dictation). Both are optional so existing
   * service implementations keep compiling — the composer renders a
   * microphone only when both are provided AND the config says enabled.
   * `getSpeechConfig` is read once per session. `getSpeechToken` is called
   * when a dictation session starts (in parallel with the mic permission
   * prompt — and again if that token aged out while the prompt sat open). The
   * token is handed to the SDK as-is and never refreshed mid-session, so a
   * session is capped to stay inside its life. No caching wanted: a stale
   * token cannot be renewed.
   */
  getSpeechConfig?(): Promise<SpeechConfig>;
  getSpeechToken?(): Promise<SpeechToken>;
}
