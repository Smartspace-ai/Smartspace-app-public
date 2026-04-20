import { ChatApi, ChatZod } from '@smartspace/api-client';
import { Subject } from 'rxjs';

import { api } from '@/platform/api';
import { ssDebug, ssError, ssWarn } from '@/platform/log';
import { parseOrThrow } from '@/platform/validation';

import { mapFileInfoDtoToModel } from '@/domains/files/mapper';
import type { FileInfo, FileScope } from '@/domains/files/model';
import {
  mapMessageDtoToModel,
  mapMessagesDtoToModels,
} from '@/domains/messages/mapper';
import type { Message } from '@/domains/messages/model';
import { mapThreadDtoToModel } from '@/domains/threads/mapper';
import {
  mapMentionUserDtoToModel,
  mapWorkspaceDtoToModel,
} from '@/domains/workspaces/mapper';

import type { ChatService } from './ChatService';
import { parseSseMessageChunk } from './sseMessageStream';

const {
  messageThreadsThreadMessagesIdMessagesResponse: messagesResponseSchema,
  filesGetFileInfoResponse: fileInfoResponseSchema,
  filesUploadFilesResponse: filesResponseSchema,
  messageThreadsGetMessageThreadWorkspacesWorkspaceIdMessagethreadsIdResponse:
    threadResponseSchema,
  workSpacesGetIdResponse: workspaceResponseSchema,
  workSpacesGetUsersResponse: workspaceUsersResponseSchema,
} = ChatZod;

const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Strip headers / config / request / response from an axios-style error before
 * it reaches any log surface. Axios error objects carry `config.headers`
 * (including `Authorization: Bearer ...`) and the full `request` / `response`
 * — all of which would leak the bearer token if forwarded to a sink that
 * captures `console.error` or reads `window.__ssLogs` (Sentry, LogRocket).
 */
function scrubAxiosError(error: unknown): unknown {
  if (!error || typeof error !== 'object') return error;
  const e = error as Record<string, unknown>;
  const scrubbed: Record<string, unknown> = {
    name: e.name,
    message: e.message,
    code: e.code,
    status: e.status,
  };
  if (e.response && typeof e.response === 'object') {
    const r = e.response as Record<string, unknown>;
    scrubbed.response = { status: r.status, statusText: r.statusText };
  }
  return scrubbed;
}

/** Backend sends null createdByUserId on system-generated values; Zod schema requires string. */
function coerceMessageDto(raw: Record<string, unknown>): void {
  if (raw.createdByUserId == null) raw.createdByUserId = '';
  if (Array.isArray(raw.values)) {
    for (const v of raw.values as Record<string, unknown>[]) {
      if (v.createdByUserId == null) v.createdByUserId = '';
    }
  }
}

const validateMessageElement = (input: unknown) =>
  messagesResponseSchema.shape.data.element.parse(input);

/**
 * Factory for the default `ChatService` that hits the production
 * `ChatApi` endpoints. The returned object is stateless — safe to
 * instantiate once at module load and share across the tree.
 */
export function createDefaultChatService(): ChatService {
  const chatApi = ChatApi.getSmartSpaceChatAPI();

  const uploadFileInChunks = async (
    file: File,
    scope: FileScope,
    onChunkUploaded?: (
      chunkIndex: number,
      totalChunks: number,
      file: File
    ) => void
  ): Promise<FileInfo> => {
    const uploadId = crypto.randomUUID();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkFile = new File([chunk], file.name, { type: file.type });
      const response = await chatApi.filesUploadFiles({
        files: [chunkFile],
        uploadId,
        chunkIndex: i,
        totalChunks,
        lastChunk: i === totalChunks - 1,
        workspaceId: scope.workspaceId,
        threadId: scope.threadId,
      });

      if (onChunkUploaded) onChunkUploaded(i + 1, totalChunks, file);

      if (i === totalChunks - 1) {
        const parsed = parseOrThrow(
          filesResponseSchema,
          response.data,
          'POST /files (chunked)'
        );
        return mapFileInfoDtoToModel(parsed[0]);
      }
    }
    throw new Error('Chunked upload did not complete.');
  };

  return {
    async fetchMessages(threadId, opts) {
      const response = await chatApi.messageThreadsThreadMessagesIdMessages(
        threadId,
        opts
      );
      const parsed = parseOrThrow(
        messagesResponseSchema,
        response.data,
        `GET /messageThreads/${threadId}/messages`
      );
      return mapMessagesDtoToModels(parsed.data);
    },

    sendMessage({ workspaceId, threadId, contentList, files, variables }) {
      const inputs: Array<{ name: string; value: unknown }> = [];

      if (contentList?.length) {
        inputs.push({ name: 'prompt', value: contentList });
      }

      if (files?.length) {
        inputs.push({
          name: 'files',
          value: files.map((file) => ({
            id: file.id,
            name: file.name,
            // backend contract: discriminator for File-type inputs
            _type: 'File',
          })),
        });
      }

      const payload = {
        inputs,
        messageThreadId: threadId,
        workspaceId,
        variables,
      };

      const observable = new Subject<Message>();

      api
        .post(`/messages`, payload, {
          adapter: 'xhr',
          headers: { Accept: 'text/event-stream' },
          onDownloadProgress: (e) => {
            const xhr = e.event?.currentTarget as XMLHttpRequest | undefined;
            const raw = String(xhr?.response ?? '');
            ssDebug('sse', 'onDownloadProgress fired', {
              rawLength: raw.length,
              xhrExists: !!xhr,
            });
            const message = parseSseMessageChunk(raw, {
              validate: validateMessageElement,
              map: mapMessageDtoToModel,
              coerce: coerceMessageDto,
            });
            if (!message) return;
            ssDebug('sse', `emitting message: ${message.id}`, {
              values: message.values?.map((v) => v.name),
            });
            observable.next(message);
          },
        })
        .then(() => {
          ssDebug('sse', 'stream complete');
          observable.complete();
        })
        .catch((error: unknown) => {
          // Scrub before logging or surfacing to subscribers — axios errors
          // carry config.headers.Authorization which must never reach
          // ssError (which writes to console.error and window.__ssLogs and
          // is captured by sinks like Sentry / LogRocket) or any subscriber.
          ssError('sse', 'stream error', scrubAxiosError(error));
          const message =
            error instanceof Error ? error.message : 'Message stream failed';
          observable.error(new Error(message));
        });

      return observable;
    },

    async addInputToMessage({ messageId, name, value, channels }) {
      let result: Message | null = null;

      await api.post(
        `/messages/${messageId}/values`,
        { name, value, channels },
        {
          adapter: 'xhr',
          headers: { Accept: 'text/event-stream' },
          onDownloadProgress: (event) => {
            const xhr = event.event?.currentTarget as
              | XMLHttpRequest
              | undefined;
            const raw = String(xhr?.response ?? '');
            const message = parseSseMessageChunk(raw, {
              validate: validateMessageElement,
              map: mapMessageDtoToModel,
              coerce: coerceMessageDto,
            });
            if (message) result = message;
          },
        }
      );

      if (!result) {
        ssWarn('sse', 'addInputToMessage stream produced no message');
        throw new Error('No valid message received from stream');
      }
      return result;
    },

    async uploadFiles(files, scope, onFileUploaded, onChunkUploaded) {
      const results: FileInfo[] = [];
      for (const file of files) {
        let fileInfo: FileInfo;
        if (file.size > CHUNK_SIZE) {
          fileInfo = await uploadFileInChunks(file, scope, onChunkUploaded);
        } else {
          const response = await chatApi.filesUploadFiles({
            files: [file],
            workspaceId: scope.workspaceId,
            threadId: scope.threadId,
          });
          const parsed = parseOrThrow(
            filesResponseSchema,
            response.data,
            'POST /files'
          );
          fileInfo = mapFileInfoDtoToModel(parsed[0]);
        }
        results.push(fileInfo);
        if (onFileUploaded) onFileUploaded(file, fileInfo);
      }
      return results;
    },

    async downloadFile(id, scope) {
      return await api.get<Blob>(`/files/${id}/download`, {
        responseType: 'blob',
        params: scope,
      });
    },

    async getFileInfo(id, scope) {
      const response = await chatApi.filesGetFileInfo(id, scope);
      const parsed = parseOrThrow(
        fileInfoResponseSchema,
        response.data,
        `GET /files/${id}`
      );
      return mapFileInfoDtoToModel(parsed);
    },

    async getFileDownloadUrl(sourceUri) {
      const data = await api.get<{ uri: string }>(sourceUri);
      const uri = data?.uri;
      if (!uri) throw new Error('Download URL is missing');
      return uri;
    },

    async fetchThread(workspaceId, threadId) {
      const response =
        await chatApi.messageThreadsGetMessageThreadWorkspacesWorkspaceIdMessagethreadsId(
          workspaceId,
          threadId
        );
      const parsed = parseOrThrow(
        threadResponseSchema,
        response.data,
        `GET /workspaces/${workspaceId}/messagethreads/${threadId}`
      );
      return mapThreadDtoToModel(parsed);
    },

    async fetchWorkspace(workspaceId) {
      const response = await chatApi.workSpacesGetId(workspaceId);
      const parsed = parseOrThrow(
        workspaceResponseSchema,
        response.data,
        `GET /workspaces/${workspaceId}`
      );
      return mapWorkspaceDtoToModel(parsed);
    },

    async fetchTaggableUsers(workspaceId) {
      const response = await chatApi.workSpacesGetUsers(workspaceId);
      const parsed = parseOrThrow(
        workspaceUsersResponseSchema,
        response.data,
        `GET /workspaces/${workspaceId}/users`
      );
      return parsed.map(mapMentionUserDtoToModel);
    },
  };
}

/**
 * Module-load singleton for app-level use.
 *
 * Constructing this runs `ChatApi.getSmartSpaceChatAPI()` eagerly at import
 * time, so any module that imports this file will trigger SDK initialization.
 * That's fine for the production app (Vite, client-only, single bundle), but
 * if you need to defer SDK init — e.g. lazy-loaded chat code-split, SSR, or a
 * test that wants to mock the SDK — import `createDefaultChatService` directly
 * and call it yourself so nothing happens at module load.
 *
 * Tests should call `createDefaultChatService()` directly.
 */
export const defaultChatService: ChatService = createDefaultChatService();
