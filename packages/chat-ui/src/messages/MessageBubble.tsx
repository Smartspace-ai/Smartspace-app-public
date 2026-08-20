// src/ui/messages/MessageList/MessageBubble.tsx
import { JsonSchema } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import Button from '@mui/material/Button';
import { FC, useEffect, useRef, useState } from 'react';

import { FileInfo } from '@/domains/files';
import { getFileIcon } from '@/domains/files/utils';
import { getDefaultValues } from '@/domains/json_forms/utils';
import { MessageContentItem } from '@/domains/messages';
import { MessageValueType } from '@/domains/messages/enums';

import { MessageMarkdown } from '@/shared/markdown/MessageMarkdown';
import { parseDateTime } from '@/shared/utils/parseDateTime';
import { cn } from '@/shared/utils/utils';

import { cells, renderers } from '@/chat-variables/renders';

import { ChatMessageCopyButton } from './MessageCopyButton';
import { ChatMessageFileDownload } from './MessageFileDownload';
import { ChatMessageImage } from './MessageImage';
import type { MessageResponseSource } from './MessageSources';
import { ChatMessageSources } from './MessageSources';

type UserOutputPayload = {
  message: string;
  schema: unknown;
};

/**
 * An answer to a question asked in the conversation is a message, not a setting:
 * the fields take the design's full scale and a composer-sized box.
 */
const USER_FORM_CONFIG = { surface: 'form', minRows: 6, maxRows: 20 };

/**
 * Hidden until the turn is hovered, but only on devices that can hover — on a
 * touch screen there is no hover state to recover it with, so it stays put.
 */
const REVEAL_ON_HOVER =
  'opacity-100 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100';

export interface MessageBubbleProps {
  createdBy: string;
  createdAt: Date;
  type: MessageValueType;
  content: MessageContentItem[];
  sources: MessageResponseSource[];
  userOutput: UserOutputPayload | null;
  userInput?: unknown;
  files: FileInfo[];
  createdByUserId?: string | null;
  chatbotName?: string;
  /**
   * True while this bubble is the tail of a running flow. Drives the design's
   * reveal animation and the blinking caret on the last line.
   */
  isStreaming?: boolean;
  onSubmitUserForm?: (name: string, value: unknown) => void;
}

export const MessageBubble: FC<MessageBubbleProps> = (props) => {
  const {
    createdBy,
    createdAt,
    type,
    content,
    sources,
    files,
    chatbotName = 'Chatbot',
    userOutput,
    userInput,
    isStreaming,
    onSubmitUserForm,
  } = props;
  const [responseFormData, setResponseFormData] = useState<unknown>(userInput);
  const [responseFormValid, setResponseFormValid] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isBotResponse = type === MessageValueType.OUTPUT;
  const showForm = userOutput;

  useEffect(() => {
    if (!userOutput || userInput !== undefined) return;
    setResponseFormData(getDefaultValues(userOutput.schema as JsonSchema));
  }, [userOutput, userInput]);

  const contentIsList =
    Array.isArray(content) && content.every((it) => it?.text || it?.image);

  // Extras shared by both roles: attachments, an interactive form, sources.
  const extras = (
    <>
      {files.length > 0 && (
        <div className="ss-chat-message__attachments mt-4 space-y-2">
          <h4 className="mb-1 text-xs font-semibold text-muted-foreground">
            Attachments
          </h4>
          {files.map((file, idx) => {
            const Icon = getFileIcon(file.name || '');
            return (
              <div
                key={file.id || idx}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/60 p-1"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="rounded-md bg-secondary p-1.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span
                    className="max-w-xs truncate text-sm font-medium text-foreground max-sm:max-w-[180px]"
                    title={file.name || 'Untitled'}
                  >
                    {file.name || 'Untitled'}
                  </span>
                </div>
                <ChatMessageFileDownload file={file} />
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="ss-chat-message__user-form mt-4 border-t border-border pt-4">
          <JsonForms
            schema={userOutput.schema as JsonSchema}
            data={responseFormData}
            renderers={renderers}
            cells={cells}
            readonly={userInput !== undefined}
            /* An answer to a question in the conversation is a message, not a
               settings field: give it a composer-sized box that keeps growing
               with what is typed instead of the three-line default the
               variables bar uses. */
            config={USER_FORM_CONFIG}
            onChange={({ data, errors }) => {
              setResponseFormData(data);
              setResponseFormValid(!errors?.length);
            }}
          />
          <div className="mt-2 flex justify-end">
            <Button
              variant="outlined"
              size="small"
              disabled={userInput !== undefined || !responseFormValid}
              className={cn(
                userInput !== undefined && 'opacity-60 cursor-not-allowed'
              )}
              onClick={() => onSubmitUserForm?.('_user', responseFormData)}
            >
              Send
            </Button>
          </div>
        </div>
      )}

      {sources.length > 0 && <ChatMessageSources sources={sources} />}
    </>
  );

  const messageBody = (
    <div ref={contentRef}>
      {contentIsList &&
        content?.map((item, i) =>
          item.text ? (
            <MessageMarkdown key={`content-${i}`} value={item.text} />
          ) : item.image ? (
            <div key={`image-${i}`} className="mt-3 first:mt-0">
              <ChatMessageImage image={item.image} />
            </div>
          ) : null
        )}
    </div>
  );

  // Who said it and when, plus the copy action. The reference design opens a
  // turn with its content, never with a byline, and closes it with a small
  // governance strip — so this sits *below* the message at that strip's weight.
  const metaRow = (
    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/80">
      <span className="min-w-0 truncate" title={createdBy}>
        {isBotResponse ? chatbotName : createdBy}
      </span>
      {createdAt ? (
        <>
          <span className="opacity-40">·</span>
          <span className="whitespace-nowrap">
            {parseDateTime(createdAt, 'D MMM, h:mm a')}
          </span>
        </>
      ) : null}
      {/* Revealed on hover only where hovering exists, so touch keeps it. */}
      <span
        className={`-my-1 [&>button]:h-6 [&>button]:w-6 ${REVEAL_ON_HOVER}`}
      >
        <ChatMessageCopyButton content={content} contentRef={contentRef} />
      </span>
    </div>
  );

  // Assistant replies read as plain prose on the canvas — the reference gives
  // them no card or avatar, only the shared `.chat-prose` typography.
  if (isBotResponse) {
    return (
      <div
        className={`group chat-prose ${isStreaming ? 'chat-streaming' : ''}`}
      >
        {messageBody}
        {extras}
        <div className="mt-2">{metaRow}</div>
      </div>
    );
  }

  // The user's own turn: a right-aligned raised bubble holding just the message,
  // with the byline tucked underneath it.
  return (
    <div className="group flex flex-col items-end">
      <div className="chat-bubble-user chat-prose min-w-0 max-w-xl">
        {messageBody}
        {extras}
      </div>
      <div className="mt-1.5">{metaRow}</div>
    </div>
  );
};
