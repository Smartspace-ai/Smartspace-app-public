import {
  AXIOS_INSTANCE,
  ChatApi,
  ChatZod,
  SignalR,
} from '@smartspace/api-client';

import { getAuthAdapter } from '@/platform/auth';
import { getApiScopes } from '@/platform/auth/scopes';
import { parseOrThrow } from '@/platform/validation';

import { FileInfo } from '@/domains/files';

import { parseSseStream } from '@/shared/utils/sseStream';

import {
  mapMessageDtoToModel,
  mapMessageErrorDtoToModel,
  mapMessageValueDtoToModel,
  mapMessagesDtoToModels,
  type MessageError,
} from './mapper';
import type { Message, MessageContentItem, MessageValue } from './model';

const {
  messageThreadsThreadMessagesIdMessagesResponse: messagesResponseSchema,
} = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

/** Backend sends null createdByUserId on system-generated values; Zod schema requires string. */
function coerceMessageDto(raw: Record<string, unknown>): void {
  if (raw.createdByUserId == null) raw.createdByUserId = '';
  if (Array.isArray(raw.values)) {
    for (const v of raw.values as Record<string, unknown>[]) {
      if (v.createdByUserId == null) v.createdByUserId = '';
    }
  }
}

// Fetch all messages in a given message thread
export async function fetchMessages(
  threadId: string,
  opts?: { take?: number; skip?: number }
): Promise<Message[]> {
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
}

// Send structured input (e.g. form values) to a specific message. The server
// streams an `IAsyncEnumerable<Message>` of intermediate states and a final
// state — we read the stream to completion and return the last successfully
// parsed Message. Used by sandbox / iterative-input flows; the standard chat
// send path uses `postMessage` + the thread SSE instead.
export async function addInputToMessage({
  messageId,
  name,
  value,
  channels,
}: {
  messageId: string;
  name: string;
  value: unknown;
  channels: Record<string, number> | null;
}): Promise<Message> {
  const baseUrl = (AXIOS_INSTANCE.defaults.baseURL ?? '').replace(/\/$/, '');
  const token = await getAuthAdapter().getAccessToken({
    silentOnly: true,
    scopes: getApiScopes(),
  });

  const response = await fetch(`${baseUrl}/messages/${messageId}/values`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, value, channels }),
  });

  if (!response.ok) {
    throw new Error(
      `POST /messages/${messageId}/values failed with status ${response.status}`
    );
  }
  if (!response.body) {
    throw new Error('POST /messages/:id/values returned no body');
  }

  const messageDtoSchema = messagesResponseSchema.shape.data.element;
  let last: Message | null = null;
  for await (const frame of parseSseStream(response.body)) {
    if (!frame.data) continue;
    try {
      const parsed = JSON.parse(frame.data) as Record<string, unknown>;
      coerceMessageDto(parsed);
      last = mapMessageDtoToModel(messageDtoSchema.parse(parsed));
    } catch {
      // Ignore malformed/partial frames; the next frame will bring fresh state.
    }
  }

  if (!last) {
    throw new Error('No valid message received from stream');
  }
  return last;
}

// Post a new user message to a thread (supports content + files + variables).
// Returns a single JSON Message synchronously — the row created server-side
// with inputs populated and id assigned. The flow continues running in the
// background; output deltas arrive on the thread SSE keyed by the returned id.
// Callers should reconcile their optimistic temp-id entry with this Message.
export async function postMessage({
  workSpaceId,
  threadId,
  contentList,
  files,
  variables,
}: {
  workSpaceId: string;
  threadId: string;
  contentList?: MessageContentItem[];
  files?: FileInfo[];
  variables?: Record<string, unknown>;
}): Promise<Message> {
  const inputs: Array<{ name: string; value: unknown }> = [];

  if (contentList?.length) {
    inputs.push({
      name: 'prompt',
      value: contentList,
    });
  }

  if (files?.length) {
    inputs.push({
      name: 'files',
      value: files.map((file) => ({
        id: file.id,
        name: file.name,
        _type: 'File',
      })),
    });
  }

  const response = await chatApi.messagesThreadMessages({
    inputs,
    messageThreadId: threadId,
    workSpaceId,
    variables,
  });

  const raw = response.data as unknown as Record<string, unknown>;
  if (!raw) throw new Error('POST /messages returned no body');
  coerceMessageDto(raw);
  return mapMessageDtoToModel(
    messagesResponseSchema.shape.data.element.parse(raw)
  );
}

/**
 * A streaming delta for an existing message. `outputs` is a cumulative
 * snapshot keyed by `(name, type)` — when an output streams from "He" → "Hel"
 * → "Hello" we receive three deltas each carrying the full text-so-far, so
 * the caller replaces by key rather than appending. Errors aren't documented
 * as cumulative.
 */
export type MessageDelta = {
  outputs: MessageValue[];
  errors: MessageError[];
};

export type ThreadStreamHandlers = {
  /** First frame: authoritative snapshot of the thread's messages. */
  onSnapshot: (messages: Message[]) => void;
  /**
   * Full-message frame. Fires when a brand-new message is added to the thread
   * (inputs populated, outputs empty). Subsequent updates to that same
   * message arrive via `onDelta`.
   */
  onMessage: (messageId: string, message: Message, terminal: boolean) => void;
  /**
   * Cumulative update for an existing message. `outputs` is keyed by
   * (name, type) — replace, do not append.
   */
  onDelta?: (messageId: string, delta: MessageDelta, terminal: boolean) => void;
  /**
   * Authoritative thread summary attached to the initial snapshot frame (so
   * late joiners see the current `isFlowRunning`) and to terminal frames
   * (so the client learns flow-complete even if SignalR flakes). Not present
   * on intermediate chunk frames.
   */
  onThread?: (thread: SignalR.MessageThreadSummary) => void;
};

export type StreamThreadMessagesResult =
  | { status: 'completed' }
  | { status: 'not-found' };

/**
 * Tails the GET `/MessageThreads/{threadId}/messages/stream` SSE endpoint.
 * Every viewer of a thread (initiator + other tabs + late joiners) subscribes
 * here. The first frame is a full snapshot; subsequent frames carry full-
 * message frames (chunk #0 for a brand-new message) or cumulative deltas
 * (chunks #1+, keyed by name+type). On reconnect we just reopen — the next
 * snapshot frame brings authoritative state, no cursor handshake needed.
 * Returns `not-found` when the server responds 404 (thread does not exist).
 */
export async function streamThreadMessages({
  threadId,
  signal,
  onSnapshot,
  onMessage,
  onDelta,
  onThread,
}: {
  threadId: string;
  signal: AbortSignal;
} & ThreadStreamHandlers): Promise<StreamThreadMessagesResult> {
  const baseUrl = (AXIOS_INSTANCE.defaults.baseURL ?? '').replace(/\/$/, '');
  const token = await getAuthAdapter().getAccessToken({
    silentOnly: true,
    scopes: getApiScopes(),
  });

  const response = await fetch(
    `${baseUrl}/MessageThreads/${threadId}/messages/stream`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal,
    }
  );

  if (response.status === 404) return { status: 'not-found' };
  if (!response.ok) {
    throw new Error(`Stream open failed with status ${response.status}`);
  }
  if (!response.body) {
    throw new Error('Stream response missing body');
  }

  const messageDtoSchema = messagesResponseSchema.shape.data.element;
  const valueDtoSchema = messageDtoSchema.shape.values.element;
  const errorDtoSchema = messageDtoSchema.shape.errors.element;

  for await (const frame of parseSseStream(response.body, signal)) {
    if (!frame.data) continue;
    try {
      const envelope = JSON.parse(frame.data) as {
        snapshot?: unknown[];
        messageId?: string;
        message?: unknown;
        delta?: {
          messageId?: string;
          outputs?: unknown[];
          errors?: unknown[];
        } | null;
        terminal?: boolean;
        thread?: SignalR.MessageThreadSummary | null;
      };
      const terminal = Boolean(envelope.terminal);

      // `thread` is attached to initial snapshot + terminal frames. Surface
      // it first so the cache flips `isFlowRunning` before we apply the
      // message payload that came with the same frame.
      if (envelope.thread && onThread) {
        onThread(envelope.thread);
      }

      if (Array.isArray(envelope.snapshot)) {
        const messages = envelope.snapshot.map((raw) => {
          const obj = raw as Record<string, unknown>;
          coerceMessageDto(obj);
          return mapMessageDtoToModel(messageDtoSchema.parse(obj));
        });
        onSnapshot(messages);
        continue;
      }

      // Chunk #0 for a new message — full Message payload.
      if (envelope.messageId && envelope.message) {
        const raw = envelope.message as Record<string, unknown>;
        coerceMessageDto(raw);
        const message = mapMessageDtoToModel(messageDtoSchema.parse(raw));
        onMessage(envelope.messageId, message, terminal);
        continue;
      }

      // Chunks #1+ for an existing message — cumulative deltas.
      if (envelope.delta) {
        const targetId = envelope.delta.messageId ?? envelope.messageId;
        if (!targetId || !onDelta) continue;
        const outputs = (envelope.delta.outputs ?? []).map((raw) => {
          const obj = raw as Record<string, unknown>;
          if (obj.createdByUserId == null) obj.createdByUserId = '';
          return mapMessageValueDtoToModel(valueDtoSchema.parse(obj));
        });
        const errors = (envelope.delta.errors ?? []).map((raw) =>
          mapMessageErrorDtoToModel(errorDtoSchema.parse(raw))
        );
        onDelta(targetId, { outputs, errors }, terminal);
      }
    } catch {
      // Ignore malformed/partial frames — server will send another envelope.
    }
  }

  return { status: 'completed' };
}
