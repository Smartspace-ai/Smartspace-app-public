// src/ui/messages/MessageList/MessageItem.tsx
'use client';

import { FC, ReactNode } from 'react';

// domains
import { FileInfo } from '@/domains/files/schemas';
import { MessageValueType } from '@/domains/messages/enums';
import { getMessageErrorText } from '@/domains/messages/errors';
import { useAddInputToMessage } from '@/domains/messages/mutations';
import { Message, MessageContentItem } from '@/domains/messages/schemas';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

// local UI
import { MessageBubble } from './MessageBubble';

interface MessageItemProps {
  message: Message;
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
    // assume already MessageContentItem[]
    items.push(...(value as MessageContentItem[]));
    return;
  }
  if (typeof value === 'object') {
    const v = value as any;
    if (v.text || v.image) {
      items.push(v);
      return;
    }
    items.push({ text: JSON.stringify(value) });
    return;
  }
  items.push({ text: String(value) });
}

export const MessageItem: FC<MessageItemProps> = ({ message }) => {
  const { threadId } = useRouteIds();
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

  // sort without mutating original
  const values = (message.values ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const bubbles: ReactNode[] = [];

  // current aggregation group
  let groupContent: MessageContentItem[] = [];
  let groupSources: any[] = [];
  let groupFiles: FileInfo[] = [];
  let groupType: MessageValueType = MessageValueType.INPUT;
  let lastCreatedAt: Date | string = '';
  let lastCreatedBy = '';

  // whether we have a pending group that hasn't been flushed to bubbles
  let groupOpen = false;
  let keyCounter = 0;

  const flush = (nextType: MessageValueType) => {
    bubbles.push(
      <MessageBubble
        key={`bubble-${message.id ?? 'msg'}-${keyCounter++}`}
        createdBy={lastCreatedBy}
        createdAt={lastCreatedAt}
        type={groupType}
        content={groupContent}
        files={groupFiles}
        sources={groupSources}
        userOutput={null}
        userInput={null}
      />
    );
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
      case 'prompt':
      case 'response':
      case 'content': {
        // These start a “fresh” content section
        if (groupContent.length > 0) flush(v.type);

        if (v.value == null) {
          pushContent(groupContent, {
            text: `<span style="color:red">🐞 Failed to generate response</span>`,
          });
        } else if (
          name === 'response' &&
          typeof v.value === 'object' &&
          (v.value as any).content
        ) {
          pushContent(groupContent, (v.value as any).content);
          groupSources = (v.value as any).sources ?? [];
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
              createdAt={v.createdAt}
              type={v.type}
              content={[{ text: (v.value as any)?.message }]}
              files={[]}
              sources={[]}
              userOutput={v.value}
              userInput={userInput?.value}
              onSubmitUserForm={onSubmitUserForm(message.id ?? '')}
            />
          );
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
        groupSources = (v.value as any[]) ?? [];
        groupOpen = true;
        break;
      }

      default: {
        // any other named value: append to current content,
        // but if we already have content from previous, keep grouping by type
        pushContent(groupContent, v.value);
        groupOpen = true;
        break;
      }
    }

    lastCreatedAt = v.createdAt;
    lastCreatedBy = v.createdBy;
  }

  // Final pending group
  if (groupOpen) {
    bubbles.push(
      <MessageBubble
        key={`bubble-final-${message.id ?? 'msg'}-${keyCounter++}`}
        createdBy={lastCreatedBy}
        createdAt={lastCreatedAt}
        type={groupType}
        content={groupContent}
        files={groupFiles}
        sources={groupSources}
        userOutput={null}
        userInput={null}
      />
    );
  }

  // Domain errors → system bubbles at the end
  for (const error of message.errors ?? []) {
    bubbles.push(
      <MessageBubble
        key={`error-${message.id ?? 'msg'}-${error.code}`}
        createdBy="Chatbot"
        createdAt={message.createdAt}
        type={MessageValueType.OUTPUT}
        content={[{ text: getMessageErrorText(error.code) }]}
        files={[]}
        sources={[]}
        userOutput={null}
        userInput={null}
      />
    );
  }

  return bubbles;
};

export default MessageItem;
