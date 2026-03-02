// src/ui/messages/MessageList/MessageBubble.tsx
import { JsonSchema } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import Button from '@mui/material/Button';
import { FC, useEffect, useState } from 'react';

import { FileInfo } from '@/domains/files';
import { getFileIcon } from '@/domains/files/utils';
import { getDefaultValues } from '@/domains/json_forms/utils';
import { MessageContentItem } from '@/domains/messages';
import { MessageValueType } from '@/domains/messages/enums';


import { cells, renderers } from '@/ui/chat-variables/renders';


import { MarkdownEditor } from '@/shared/ui/markdown/MarkdownEditor';
import { Avatar, AvatarFallback } from '@/shared/ui/mui-compat/avatar';
import { getInitials } from '@/shared/utils/initials';
import { parseDateTime } from '@/shared/utils/parseDateTime';
import { cn } from '@/shared/utils/utils';


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
  content: MessageContentItem[] ;
  sources: MessageResponseSource[] ;
  userOutput: UserOutputPayload | null;
  userInput?: unknown;
  files: FileInfo[];
  onSubmitUserForm?: (name: string, value: unknown) => void;
}


export const MessageBubble: FC<MessageBubbleProps> = (props) => {
  const {
    createdBy, createdAt, type, content, sources, files,
    userOutput, userInput, onSubmitUserForm,
  } = props;
  const [responseFormData, setResponseFormData] = useState<unknown>(userInput);
  const [responseFormValid, setResponseFormValid] = useState<boolean>(false);
  const isBotResponse = type === MessageValueType.OUTPUT;
  const showForm = userOutput ;


  useEffect(() => {
    if (!userOutput || userInput !== undefined) return;
    setResponseFormData(getDefaultValues(userOutput.schema as JsonSchema));
  }, [userOutput, userInput]);

  const contentIsList = Array.isArray(content) && content.every((it) => it?.text || it?.image);

  return (
    <div className={cn(isBotResponse ? 'border bg-background shadow-md' : '', 'rounded-lg mb-4 group')}>
      <div className={cn(isBotResponse ? 'border-b' : '', 'flex items-center justify-between p-3')}>
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 mt-0.5">
            <AvatarFallback className="text-xs">
              {getInitials(isBotResponse ? 'Chatbot' : createdBy)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-medium">{isBotResponse ? 'Chatbot' : createdBy}</span>
            <span className="text-xs text-muted-foreground">
              {createdAt ? parseDateTime(createdAt, 'Do MMMM YYYY, h:mm a') : ''}
            </span>
          </div>
        </div>
        <ChatMessageCopyButton content={content} />
      </div>

      <div className={cn(isBotResponse ? 'p-4' : 'px-4 py-2')}>
        {contentIsList && content?.map((item, i) => (
          item.text ? (
            <div key={`content-${i}`} className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed mb-3 last:mb-0">
              <MarkdownEditor value={item.text} editable={false} />
            </div>
          ) : item.image ? (
            <div key={`image-${i}`} className="mb-3 last:mb-0">
              <ChatMessageImage image={item.image}  />
            </div>
          ) : null
        ))}

        {files.length > 0 && (
          <div className="ss-chat-message__attachments mt-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">Attachments</h4>
            {files.map((file, idx) => {
              const Icon = getFileIcon(file.name || '');
              return (
                <div key={file.id || idx} className="flex items-center justify-between gap-3 p-1 bg-muted/60 border border-muted rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-muted rounded-md p-1.5"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground truncate max-w-[220px] sm:max-w-xs">{file.name || 'Untitled'}</span>
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
              onChange={({ data, errors }) => { setResponseFormData(data); setResponseFormValid(!errors?.length); }}
            />
            <div className="flex justify-end mt-2">
              <Button
                variant="outlined"
                size="small"
                disabled={userInput !== undefined || !responseFormValid}
                className={cn(userInput !== undefined && 'opacity-60 cursor-not-allowed')}
                onClick={() => onSubmitUserForm?.('_user', responseFormData)
                }
              >
                Send
              </Button>
            </div>
          </div>
        )}

        <ChatMessageSources sources={sources} />
      </div>
    </div>
  );
};

