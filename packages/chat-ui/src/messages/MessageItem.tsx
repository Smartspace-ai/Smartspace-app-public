// src/ui/messages/MessageList/MessageItem.tsx

import { FC, ReactNode } from 'react';

import { useChatContext } from '@/platform/chat';

import { FileInfo } from '@/domains/files';
import { Message, MessageContentItem } from '@/domains/messages';
import { MessageValueType } from '@/domains/messages/enums';
import { getMessageErrorText } from '@/domains/messages/errors';
import { useAddInputToMessage } from '@/domains/messages/mutations';
import { MessageResponseSchema } from '@/domains/messages/schemas';
import {
  getRetryStatusText,
  parseRetryStatus,
} from '@/domains/messages/statuses';
import { useWorkspace } from '@/domains/workspaces';

import { getChatbotName } from '@/theme/public-config';

// local UI
import { MessageBubble } from './MessageBubble';
import type { MessageResponseSource } from './MessageSources';
import { ThinkingSection } from './ThinkingSection';

interface MessageItemProps {
  message: Message;
  /**
   * True when this is the most recent message in the thread AND the flow
   * is still running. Gates the trailing thinking section — without this, a
   * stuck `status` value in `message.values` (e.g. one tool's "running"
   * status that arrived after another tool's content during a
   * parallel-tool-call run, with no clearing frame from the backend)
   * would render as a permanent row below the response.
   */
  isLive?: boolean;
}

/** shallow-enough equality for small channel maps like { stream: 0 } */
function channelsEqual(
  a: Record<string, number> = {},
  b: Record<string, number> = {}
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

/** push value(s) into content items, normalizing shapes */
function pushContent(items: MessageContentItem[], value: unknown) {
  if (value == null) return;
  if (typeof value === 'string') {
    items.push({ text: value });
    return;
  }
  if (Array.isArray(value)) {
    // A normal LLM response arrives as MessageContentItem[] (each part a
    // { text } / { image }). But a block that emits structured output —
    // e.g. a content checker returning [{ category, issue, ... }] — hands
    // us a top-level array whose items are NOT content parts. Spreading
    // those verbatim pushes text/image-less items that render to nothing
    // (contentIsList in MessageBubble fails), painting a blank bubble.
    // Only spread when the items really are content parts; otherwise fall
    // back to a JSON code block, mirroring the object branch below.
    const looksLikeContent = value.every(
      (it) =>
        it != null && typeof it === 'object' && ('text' in it || 'image' in it)
    );
    if (looksLikeContent) {
      items.push(...(value as MessageContentItem[]));
    } else {
      items.push({
        text: '```json\n' + JSON.stringify(value, null, 2) + '\n```',
      });
    }
    return;
  }
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    const text = typeof v.text === 'string' ? v.text : undefined;
    const imageRaw = v.image;
    const image =
      imageRaw &&
      typeof imageRaw === 'object' &&
      typeof (imageRaw as Record<string, unknown>).id === 'string' &&
      typeof (imageRaw as Record<string, unknown>).name === 'string'
        ? (imageRaw as { id: string; name: string })
        : undefined;

    if (text !== undefined || image !== undefined) {
      items.push({
        ...(text !== undefined ? { text } : {}),
        ...(image ? { image } : {}),
      });
      return;
    }
    // Structured output from a block that isn't a content part. Fence it the
    // way the array branch above does — a bare stringify drops an unreadable
    // wall of JSON straight into the prose.
    items.push({
      text: '```json\n' + JSON.stringify(value, null, 2) + '\n```',
    });
    return;
  }
  items.push({ text: String(value) });
}

function isMessageResponseSource(x: unknown): x is MessageResponseSource {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return typeof obj.index === 'number' && typeof obj.sourceType === 'string';
}

function coerceSources(x: unknown): MessageResponseSource[] {
  if (!Array.isArray(x)) return [];
  return x.filter(isMessageResponseSource);
}

/** Derived, not hand-listed: a field added to the envelope must not make every
 *  chat reply fail the test below and render as raw JSON. */
const ENVELOPE_KEYS = Object.keys(MessageResponseSchema.shape);

/**
 * True when a `response` object is the chat envelope rather than a block's
 * structured output. Matched on the key set as a whole — "carries a content
 * key" is not enough, because a research payload with its own `sources` array
 * would be unwrapped to an undefined `.content` and render no bubble at all.
 *
 * Deliberately no content/sources requirement: a streaming tool round can
 * deliver an early frame with neither filled in yet, and that must stay an
 * envelope rather than getting fenced into the transcript as JSON.
 *
 * A block emitting exactly `{ content: … }` as data is indistinguishable from
 * an envelope here, and is read as one.
 */
function isResponseEnvelope(keys: string[]): boolean {
  return keys.length > 0 && keys.every((key) => ENVELOPE_KEYS.includes(key));
}

export const MessageItem: FC<MessageItemProps> = ({
  message,
  isLive = false,
}) => {
  const { workspaceId, threadId } = useChatContext();
  const { data: workspace } = useWorkspace(workspaceId);
  const chatbotName = getChatbotName(workspace?.name);
  const { addInputToMessageMutation } = useAddInputToMessage();

  const onSubmitUserForm =
    (messageId: string) => (name: string, value: unknown) => {
      if (!threadId || !messageId) return;
      addInputToMessageMutation.mutate({
        threadId,
        messageId,
        name,
        value,
        channels: {},
      });
    };

  const safeTime = (d: Date) => {
    const t = d.getTime();
    return Number.isFinite(t) ? t : 0;
  };

  // Sort and collapse repeats of the SAME value, retaining the last
  // occurrence. Streaming responses can produce one OUTPUT value per chunk;
  // without this, each chunk renders as its own bubble (cumulative-text
  // ladder). Keyed on `id`, which the server holds still across a streaming
  // output's chunks — NOT on (name, type), which cannot tell those chunks
  // apart from several blocks wired into one flow output (five render blocks
  // feeding a single "Files" output, say) and dropped all but the last file.
  const sortedValues = (message.values ?? [])
    .slice()
    .sort((a, b) => safeTime(a.createdAt) - safeTime(b.createdAt));
  const slotByKey = new Map<string, number>();
  const values: typeof sortedValues = [];
  for (const v of sortedValues) {
    // Fall back to (name, type) for values with no id, so a chunk stream from
    // an older server still collapses rather than laddering.
    const key = v.id ? `id|${v.id}` : `nametype|${v.name}|${v.type}`;
    const existing = slotByKey.get(key);
    if (existing !== undefined) {
      values[existing] = v;
    } else {
      slotByKey.set(key, values.length);
      values.push(v);
    }
  }

  const bubbles: ReactNode[] = [];

  // current aggregation group
  let groupContent: MessageContentItem[] = [];
  let groupSources: MessageResponseSource[] = [];
  let groupFiles: FileInfo[] = [];
  let groupType: MessageValueType = MessageValueType.INPUT;
  let lastCreatedAt: Date = message.createdAt;
  let lastCreatedBy = '';
  let lastCreatedByUserId: string | null | undefined = message.createdByUserId;

  // whether we have a pending group that hasn't been flushed to bubbles
  let groupOpen = false;
  let keyCounter = 0;

  // transient status: only the last status is kept, cleared when content follows
  let lastStatusText: string | null = null;

  // Whether this message has painted any assistant output yet. Drives the
  // thinking gate below: once the answer starts printing there's nothing left
  // to wait on, so the indicator goes away. Deliberately tracks OUTPUT only —
  // a user's own prompt bubble must not count, or the indicator would vanish
  // in the gap between sending and the first token.
  let hasOutputContent = false;

  const groupHasAnything = () =>
    groupContent.length > 0 || groupFiles.length > 0 || groupSources.length > 0;

  const flush = (nextType: MessageValueType) => {
    // A group can be "open" yet hold nothing renderable (e.g. an empty
    // `sources` output followed by a status flush) — pushing it would
    // paint an empty bubble.
    if (groupHasAnything()) {
      if (groupType === MessageValueType.OUTPUT) hasOutputContent = true;
      bubbles.push(
        <MessageBubble
          key={`bubble-${message.id ?? 'msg'}-${keyCounter++}`}
          createdBy={lastCreatedBy}
          createdByUserId={lastCreatedByUserId}
          createdAt={lastCreatedAt}
          type={groupType}
          content={groupContent}
          files={groupFiles}
          sources={groupSources}
          chatbotName={chatbotName}
          userOutput={null}
          userInput={null}
        />
      );
    }
    groupContent = [];
    groupFiles = [];
    groupSources = [];
    groupType = nextType;
    groupOpen = false;
  };

  for (const v of values) {
    // If the value's type changes and there's a pending group → flush first
    if (groupOpen && groupType !== v.type) {
      flush(v.type);
    }

    groupType = v.type;
    const name = v.name.toLowerCase();

    switch (name) {
      case 'variables':
      case 'userinfo': {
        // Internal system inputs — never render
        continue;
      }
      case 'status': {
        if (groupOpen) flush(v.type);
        // Structured statuses (e.g. the LLM retry loop's backoff notice)
        // render a human sentence; plain strings render verbatim as before.
        const retryStatus = parseRetryStatus(v.value);
        lastStatusText = retryStatus
          ? getRetryStatusText(retryStatus)
          : String(v.value ?? '');
        continue;
      }
      case 'prompt':
      case 'response':
      case 'content': {
        if (v.value === '') {
          // A retraction: the block streamed narration onto the response
          // and then cleared it when the round turned out to be a tool
          // round. Render nothing (the narration re-arrives as status).
          continue;
        }
        lastStatusText = null;
        // These start a “fresh” content section
        if (groupContent.length > 0) flush(v.type);

        if (v.value == null) {
          pushContent(groupContent, {
            text: `<span style="color:red">🐞 Failed to generate response</span>`,
          });
        } else if (
          name === 'response' &&
          typeof v.value === 'object' &&
          v.value !== null &&
          !Array.isArray(v.value)
        ) {
          const resp = v.value as Record<string, unknown>;
          const keys = Object.keys(resp);
          const isEnvelope = isResponseEnvelope(keys);

          // Citations travel with chat content in either shape. On a
          // structured payload `sources` is just another data field, and
          // coercing it would drop the group's real citations on the floor.
          if (
            'sources' in resp &&
            (isEnvelope || 'text' in resp || 'image' in resp)
          ) {
            groupSources = coerceSources(resp.sources);
          }

          if (isEnvelope) {
            pushContent(groupContent, resp.content);
          } else if (keys.length > 0) {
            // Structured output — a response pin carrying a schema-shaped
            // object rather than chat text. Unwrapping it as an envelope found
            // `.content` undefined and painted nothing at all. Hand the whole
            // object to pushContent, which renders a content part as-is and
            // fences anything else as JSON.
            pushContent(groupContent, resp);
          }
        } else {
          pushContent(groupContent, v.value);
        }

        groupOpen = true;
        break;
      }

      case '_user': {
        // user interaction packets are rendered as their own bubble
        // try to find the matching INPUT user value in the same channel map
        if (v.type !== MessageValueType.INPUT) {
          const userInput = values.find(
            (u) =>
              u.name === '_user' &&
              u.type === MessageValueType.INPUT &&
              channelsEqual(u.channels, v.channels)
          );

          bubbles.push(
            <MessageBubble
              key={`user-${message.id ?? 'msg'}-${keyCounter++}`}
              createdBy={v.createdBy}
              createdByUserId={v.createdByUserId}
              createdAt={v.createdAt}
              type={v.type}
              content={[
                {
                  text:
                    typeof (v.value as Record<string, unknown> | null)
                      ?.message === 'string'
                      ? String((v.value as Record<string, unknown>).message)
                      : '',
                },
              ]}
              files={[]}
              sources={[]}
              userOutput={
                v.value && typeof v.value === 'object'
                  ? (v.value as unknown as { message: string; schema: unknown })
                  : null
              }
              chatbotName={chatbotName}
              userInput={userInput?.value}
              onSubmitUserForm={onSubmitUserForm(message.id ?? '')}
            />
          );
          // A user-interaction form is rendered output: the flow is waiting on
          // the person now, not thinking, so this counts toward the gate below.
          hasOutputContent = true;
        }
        // do not mark groupOpen; this stands alone
        break;
      }

      case 'files': {
        groupFiles = Array.isArray(v.value)
          ? (v.value as FileInfo[])
          : [v.value as FileInfo];
        groupOpen = true;
        break;
      }

      case 'sources': {
        groupSources = coerceSources(v.value);
        // an empty sources output (common when a flow wires the pin but
        // the round produced no citations) must not open a bubble group
        if (groupSources.length > 0) groupOpen = true;
        break;
      }

      default: {
        lastStatusText = null;
        // any other named value: append to current content,
        // but if we already have content from previous, keep grouping by type
        pushContent(groupContent, v.value);
        groupOpen = true;
        break;
      }
    }

    lastCreatedAt = v.createdAt;
    lastCreatedBy = v.createdBy;
    lastCreatedByUserId = v.createdByUserId;
  }

  // Final pending group
  if (groupOpen && groupHasAnything()) {
    if (groupType === MessageValueType.OUTPUT) hasOutputContent = true;
    bubbles.push(
      <MessageBubble
        key={`bubble-final-${message.id ?? 'msg'}-${keyCounter++}`}
        isStreaming={isLive}
        createdBy={lastCreatedBy}
        createdByUserId={lastCreatedByUserId}
        createdAt={lastCreatedAt}
        type={groupType}
        content={groupContent}
        files={groupFiles}
        sources={groupSources}
        chatbotName={chatbotName}
        userOutput={null}
        userInput={null}
      />
    );
  }

  // The one thinking affordance for this message, and the only place tool
  // statuses surface — they share this row instead of printing their own line
  // under the answer.
  //
  // Only while the message is live (last in the thread + flow still running).
  // Once the flow ends, any status left over in `message.values` is stale —
  // typically from parallel tool calls where one tool's status arrived after
  // another's content with no clearing frame to overwrite it — and without
  // this gate it would sit there permanently.
  //
  // While live, it shows when either the flow has something to narrate, or
  // nothing has printed yet. Once the answer starts streaming and no status is
  // outstanding there is nothing left to wait on, so it goes away rather than
  // sitting under the output for the rest of the run. A later tool round
  // brings it back with that round's status.
  const showThinking = isLive && (lastStatusText !== null || !hasOutputContent);
  if (showThinking) {
    bubbles.push(
      <ThinkingSection
        key={`thinking-${message.id ?? 'msg'}`}
        status={lastStatusText}
      />
    );
  }

  // Domain errors → system bubbles at the end.
  // Keyed by index as well as code: a message can carry the same code twice
  // (a run that failed the same way on two rounds), and keying on the code
  // alone made React drop one of the pair as a duplicate.
  (message.errors ?? []).forEach((error, errorIndex) => {
    bubbles.push(
      <MessageBubble
        key={`error-${message.id ?? 'msg'}-${errorIndex}-${
          error.errorCode ?? error.code
        }`}
        createdBy={chatbotName}
        createdAt={message.createdAt}
        type={MessageValueType.OUTPUT}
        content={[{ text: getMessageErrorText(error) }]}
        files={[]}
        sources={[]}
        chatbotName={chatbotName}
        userOutput={null}
        userInput={null}
      />
    );
  });

  return bubbles;
};

export default MessageItem;
