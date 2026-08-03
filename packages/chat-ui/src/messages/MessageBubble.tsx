// src/ui/messages/MessageList/MessageBubble.tsx
import { JsonSchema } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import Button from '@mui/material/Button';
import { User } from 'lucide-react';
import { FC, ReactNode, useEffect, useRef, useState } from 'react';

import { FileInfo } from '@/domains/files';
import { getFileIcon } from '@/domains/files/utils';
import { getDefaultValues } from '@/domains/json_forms/utils';
import { MessageContentItem } from '@/domains/messages';
import { MessageValueType } from '@/domains/messages/enums';

import { MessageMarkdown } from '@/shared/markdown/MessageMarkdown';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/mui-compat/avatar';
import { getInitials } from '@/shared/utils/initials';
import { parseDateTime } from '@/shared/utils/parseDateTime';
import { getUserPhotoUrl } from '@/shared/utils/userPhoto';
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
    createdByUserId,
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

  const timestamp = createdAt
    ? parseDateTime(createdAt, 'Do MMMM YYYY, hh:mm:ss a')
    : '';

  const body: ReactNode = (
    <>
      <div ref={contentRef}>
        {contentIsList &&
          content?.map((item, i) =>
            item.text ? (
              <div
                key={`content-${i}`}
                className={cn(
                  'prose prose-sm max-w-none text-[13px] mb-3 last:mb-0',
                  isBotResponse
                    ? 'leading-[1.7] dark:prose-invert'
                    : 'prose-invert leading-relaxed'
                )}
              >
                <MessageMarkdown value={item.text} />
              </div>
            ) : item.image ? (
              <div key={`image-${i}`} className="mb-3 last:mb-0">
                <ChatMessageImage image={item.image} />
              </div>
            ) : null
          )}
      </div>

      {files.length > 0 && (
        <div className="ss-chat-message__attachments mt-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground mb-1">
            Attachments
          </h4>
          {files.map((file, idx) => {
            const Icon = getFileIcon(file.name || '');
            return (
              <div
                key={file.id || idx}
                className="flex items-center justify-between gap-3 p-1 bg-muted/60 border border-muted rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-muted rounded-md p-1.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground truncate max-w-[220px] sm:max-w-xs">
                      {file.name || 'Untitled'}
                    </span>
                  </div>
                </div>
                <ChatMessageFileDownload file={file} />
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="mt-4 pt-4 border-t border-border">
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
          <div className="flex justify-end mt-2">
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

  if (isBotResponse) {
    return (
      <div className="group flex flex-col items-start">
        <div className="flex w-full items-start gap-3">
          <div className="mt-1 flex h-8 w-8 min-w-[32px] shrink-0 items-center justify-center rounded-full bg-secondary">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 max-w-4xl flex-1 rounded-xl border border-chat-bot-border bg-chat-bot px-6 py-5 text-chat-bot-foreground">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {chatbotName}
              </p>
              <ChatMessageCopyButton
                content={content}
                contentRef={contentRef}
              />
            </div>
            {body}
          </div>
        </div>
        <p className="ml-[44px] mt-1.5 text-xs text-muted-foreground">
          {timestamp}
        </p>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-end">
      <div className="flex max-w-full items-start gap-2.5">
        <div className="min-w-0 max-w-lg rounded-2xl rounded-tr-lg bg-chat-user px-5 py-3 text-chat-user-foreground">
          <div className="mb-0.5 flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold">{createdBy}</p>
            <ChatMessageCopyButton content={content} contentRef={contentRef} />
          </div>
          {body}
        </div>
        <Avatar className="h-8 w-8 min-w-[32px] shrink-0">
          {createdByUserId ? (
            <AvatarImage src={getUserPhotoUrl(createdByUserId)} alt={createdBy}>
              <AvatarFallback
                colored={false}
                className="bg-chat-user/30 text-xs font-semibold text-primary"
              >
                {getInitials(createdBy)}
              </AvatarFallback>
            </AvatarImage>
          ) : (
            <AvatarFallback
              colored={false}
              className="bg-chat-user/30 text-xs font-semibold text-primary"
            >
              {getInitials(createdBy)}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      <p className="mr-[42px] mt-1.5 text-xs text-muted-foreground">
        {timestamp}
      </p>
    </div>
  );
};
