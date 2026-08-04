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
        <div className="mt-4 border-t border-border pt-4">
          <JsonForms
            schema={userOutput.schema as JsonSchema}
            data={responseFormData}
            renderers={renderers}
            cells={cells}
            readonly={userInput !== undefined}
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

  // Assistant replies read as plain prose on the canvas — the reference gives
  // them no card or avatar, only the shared `.chat-prose` typography.
  if (isBotResponse) {
    return (
      <div className="group chat-prose">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {chatbotName}
            {createdAt ? (
              <span className="ml-2 font-normal opacity-70">
                {parseDateTime(createdAt, 'D MMM, h:mm a')}
              </span>
            ) : null}
          </span>
          <ChatMessageCopyButton content={content} contentRef={contentRef} />
        </div>
        {messageBody}
        {extras}
      </div>
    );
  }

  // The user's own turn: a right-aligned raised bubble.
  return (
    <div className="group flex justify-end">
      <div className="chat-bubble-user chat-prose min-w-0 max-w-xl">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <span
            className="min-w-0 truncate text-xs font-medium opacity-70"
            title={createdBy}
          >
            {createdBy}
            {createdAt ? (
              <span className="ml-2 font-normal">
                {parseDateTime(createdAt, 'D MMM, h:mm a')}
              </span>
            ) : null}
          </span>
          <ChatMessageCopyButton content={content} contentRef={contentRef} />
        </div>
        {messageBody}
        {extras}
      </div>
    </div>
  );
};
