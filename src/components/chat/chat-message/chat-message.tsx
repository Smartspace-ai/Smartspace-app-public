import { Message } from '@/domains/messages';
import { getErrorMessage } from '@/domains/messages/error-utils';
import {
  MessageContent,
  MessageFile,
} from '@/domains/messages/schemas';
import { MessageValueType } from '@/domains/messages/types';
import { JsonSchema } from '@jsonforms/core';
import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import _ from 'lodash';
import { FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo, Presentation } from 'lucide-react';
import { FC, ReactNode, useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';


import { MessageResponseSource } from '../../../models/message-response-source';
import { getInitials } from '../../../utils/initials';
import { parseDateTime } from '../../../utils/parse-date-time';
import { MyMarkdown } from '../../markdown/my-markdown';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Button } from '../../ui/button';
import ChatMessageCopyButton from '../chat-message-copy-button/chat-message-copy-button';
import ChatMessageFileDownload from '../chat-message-file-download/chat-message-file-download';
import { ChatMessageImage } from '../chat-message-image/chat-message-image';
import { ChatMessageSources } from '../chat-message-sources/chat-message-sources';
import { TextInputControl, textInputTester } from './text-renderer';

// Utility function to get file type icon
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '')) {
    return FileImage;
  }
  
  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '')) {
    return FileVideo;
  }
  
  // Audio files
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extension || '')) {
    return FileAudio;
  }
  
  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension || '')) {
    return FileArchive;
  }
  
  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'html', 'css', 'json', 'xml', 'md'].includes(extension || '')) {
    return FileCode;
  }
  
  // Spreadsheet files
  if (['xlsx', 'xls', 'csv'].includes(extension || '')) {
    return FileSpreadsheet;
  }
  
  // Presentation files
  if (['pptx', 'ppt'].includes(extension || '')) {
    return Presentation;
  }
  
  // Default document icon
  return FileText;
};

export interface ContentItem {
  text?: string;
  image?: MessageFile;
}

interface MessageValueProps {
  chatbotName: string;
  createdBy: string;
  createdAt: Date | string;
  type: MessageValueType;
  content: MessageContent[] | null;
  sources: MessageResponseSource[] | null;
  userOutput: { message: string; schema: Record<string, any> } | null;
  userInput?: any;
  files: MessageFile[] | null;
  position?: 'left' | 'right';
  responseData?: any | null;
  useMessageFile: (id: string) => {
    useMessageFileRaw: UseQueryResult<Blob, Error>;
  };
  addValueToMessage?: (name: string, value: any) => void;
  useQueryFiles: () => {
    downloadFileMutation: UseMutationResult<
      void,
      Error,
      { name: string; sourceUri: string },
      unknown
    >;
  };
  downloadFile: (id: string) => Promise<Blob>;
  saveFile: (blob: Blob, fileName: string) => void;
}

export const ValueCollection: FC<MessageValueProps> = (props) => {
  const {
    createdBy,
    createdAt,
    type,
    content,
    sources,
    files,
    userOutput,
    userInput,
    useQueryFiles,
    useMessageFile,
    addValueToMessage,
    chatbotName,
  } = props;

  const [responseFormData, setResponseFormData] = useState<any>(userInput);
  const [responseFormValid, setResponseFormValid] = useState<boolean>(false);

  const isBotResponse = type === MessageValueType.OUTPUT;
  const showForm = userOutput && addValueToMessage;

  useEffect(() => {
    if (!userOutput || userInput !== undefined) return;
    const defaultValues = getDefaultValues(userOutput.schema as JsonSchema);
    setResponseFormData(defaultValues);
  }, [userOutput, userInput]);

  const contentIsContentList = Array.isArray(content) && content.every((item) => item.text || item.image);

  return (
    <div
      className={cn(
        isBotResponse ? 'border bg-background shadow-md' : '',
        'rounded-lg mb-4 group'
      )}
    >
      <div
        className={cn(
          isBotResponse ? 'border-b' : '',
          'flex items-center justify-between p-3'
        )}
      >
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 mt-0.5">
            <AvatarFallback
              className={cn(
                'text-xs',
                isBotResponse
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {getInitials(isBotResponse ? chatbotName : createdBy)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-medium">
              {isBotResponse ? chatbotName : createdBy}
            </span>
            <span className="text-xs text-muted-foreground">
              {createdAt
                ? parseDateTime(createdAt, 'Do MMMM YYYY, h:mm a')
                : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ChatMessageCopyButton content={content} />
        </div>
      </div>

      <div className={cn(isBotResponse ? 'p-4' : 'px-4 py-2')}>
        {contentIsContentList &&
          content?.map((item, i) => {
            if (item.text && item.text.length > 0) {
              return (
                <div key={`content-${i}`} className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed mb-3 last:mb-0">
                  <MyMarkdown text={item.text} />
                </div>
              );
            }
            if (item.image) {
              return (
                <div key={`image-${i}`} className="mb-3 last:mb-0">
                  <ChatMessageImage
                    image={item.image}
                    name={item.image.name ?? ''}
                    useMessageFile={useMessageFile}
                  />
                </div>
              );
            }

            return ""
          })
        }

          {files && files.length > 0 && (
            <div className="ss-chat-message__attachments mt-4 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                Attachments
              </h4>
              {files.map((file, idx) => {
                const FileIcon = getFileIcon(file.name || '');
                return (
                  <div
                    key={file.id || idx}
                    className="flex items-center justify-between gap-3 p-1 bg-muted/60 border border-muted rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-muted rounded-md p-1.5">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground truncate max-w-[220px] sm:max-w-xs">
                          {file.name || 'Untitled'}
                        </span>
                      </div>
                    </div>
                    <ChatMessageFileDownload
                      file={file}
                      downloadFile={props.downloadFile}
                      saveFile={props.saveFile}
                    />
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
              renderers={[
                { tester: textInputTester, renderer: TextInputControl },
                ...materialRenderers,
              ]}
              cells={materialCells}
              readonly={userInput !== undefined}
              onChange={({ data, errors }) => {
                setResponseFormData(data);
                setResponseFormValid(!errors?.length);
              }}
            />
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={userInput !== undefined || !responseFormValid}
                className={cn(
                  userInput !== undefined && 'opacity-60 cursor-not-allowed'
                )}
                onClick={() => addValueToMessage?.('_user', responseFormData)}
              >
                Send
              </Button>
            </div>
          </div>
        )}

          <ChatMessageSources sources={sources || []} />
      </div>
    </div>
  );
};

interface ChatMessageProps {
  userId: string;
  avatar?: string | JSX.Element;
  message: Message;
  messageId?: string;
  isLast?: boolean;
  responseData?: any | null;
  useMessageFile: (id: string) => {
    useMessageFileRaw: UseQueryResult<Blob, Error>;
  };
  addValueToMessage: (
    messageId: string,
    name: string,
    value: any,
    channels: Record<string, number>
  ) => void;
  useQueryFiles: () => {
    downloadFileMutation: UseMutationResult<
      void,
      Error,
      { name: string; sourceUri: string },
      unknown
    >;
  };
  downloadFile: (id: string) => Promise<Blob>;
  saveFile: (blob: Blob, fileName: string) => void;
  chatbotName: string;
}

export const ChatMessage: FC<ChatMessageProps> = ({
  userId,
  message,
  useQueryFiles,
  downloadFile,
  saveFile,
  useMessageFile,
  addValueToMessage,
  chatbotName,
}) => {
  const values =
    message.values?.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ) || [];

  const results: ReactNode[] = [];


  let content: ContentItem[] | null = null;
  let sources: any[] | null = null;
  let files: MessageFile[] | null = null;
  let currentType: MessageValueType = MessageValueType.INPUT;
  let createdAt: Date | string = '';
  let createdBy = '';
  let valuesSavedToCollection = false;
  let channels: Record<string, number> = {};
  let collectionKey = 0;

  const addValueToContent = (value: any) => {
    if (!content) content = [];

    if (typeof value === 'string') {
      content.push({ text: value });
    } else if (Array.isArray(value)) {
      content = content.concat(value);
    } else if (value.text || value.image) {
      content.push(value);
    } else {
      content.push({ text: JSON.stringify(value) });
    }
  };

  const saveCollection = (nextType: MessageValueType) => {
    results.push(
      <ValueCollection
        key={`collection-${collectionKey++}`}
        chatbotName={chatbotName}
        createdBy={createdBy}
        createdAt={createdAt}
        type={currentType}
        content={content}
        files={files}
        sources={sources}
        userOutput={null}
        userInput={null}
        useMessageFile={useMessageFile}
        downloadFile={downloadFile}
        saveFile={saveFile}
        useQueryFiles={useQueryFiles}
        addValueToMessage={(name: string, val: any) => {
          addValueToMessage(message.id ?? '', name, val, channels);
        }}
      />
    );
    content = null;
    files = null;
    sources = null;
    currentType = nextType;
    valuesSavedToCollection = true;
    channels = {};
  };

  for (const value of values) {
    if (currentType !== value.type && !valuesSavedToCollection) {
      saveCollection(value.type);
    }

    currentType = value.type;

    Object.entries(value.channels).forEach(([ch, index]) => {
      if (!channels[ch] || index > channels[ch]) {
        channels[ch] = index;
      }
    });

    const valueName = value.name.toLowerCase();

    switch (valueName) {
      case 'prompt':
      case 'response':
      case 'content':
        if (content) saveCollection(value.type);
        if (value.value == null) {
          addValueToContent({ text: `<span style="color:red">🐞 Failed to generate response</span>` })
        }
        else if (
          valueName === 'response' && value.value != null &&
          typeof value.value === 'object' &&
          ('content' in value.value || 'sources' in value.value)
        ) {
          addValueToContent(value.value?.content);
          sources = value.value?.sources;
        } else {
          addValueToContent(value.value);
        }
        valuesSavedToCollection = false;
        break;

      case '_user':
        if (!valuesSavedToCollection) {
          saveCollection(value.type);
        }

        if (value.type !== MessageValueType.INPUT) {
          const userInput = values.find(
            (v) =>
              v.name === '_user' &&
              v.type === MessageValueType.INPUT &&
              _.isEqual(v.channels, value.channels)
          );

          results.push(
            <ValueCollection
              key={`collection-${collectionKey++}`}
              chatbotName={chatbotName}
              createdBy={value.createdBy}
              createdAt={value.createdAt}
              type={value.type}
              content={[{ text: value.value.message }]}
              files={[]}
              sources={[]}
              userOutput={value.value}
              userInput={userInput?.value}
              useMessageFile={useMessageFile}
              downloadFile={downloadFile}
              saveFile={saveFile}
              useQueryFiles={useQueryFiles}
              addValueToMessage={(name: string, val: any) =>
                addValueToMessage(message.id ?? '', name, val, value.channels)
              }
            />
          );
        }
        break;

      case 'files':
        if (Array.isArray(value.value)) {
          files = value.value;
        } else {
          files = [{ id: value.value.id, name: value.value.name }];
        }
        valuesSavedToCollection = false;
        break;

      case 'sources':
        sources = value.value;
        valuesSavedToCollection = false;
        break;

      default:
        if (content) saveCollection(value.type);
        addValueToContent(value.value);
        break;
    }

    createdAt = value.createdAt;
    createdBy = value.createdBy;
  }

  if (!valuesSavedToCollection) {
    results.push(
      <ValueCollection
        key={`collection-final-${collectionKey++}`}
        chatbotName={chatbotName}
        createdBy={createdBy}
        createdAt={createdAt}
        type={currentType}
        content={content}
        files={files}
        sources={sources}
        userOutput={null}
        userInput={null}
        useMessageFile={useMessageFile}
        downloadFile={downloadFile}
        saveFile={saveFile}
        useQueryFiles={useQueryFiles}
      />
    );
  }

  // Check for errors and show appropriate error messages
  message.errors?.forEach((error) => {
    results.push(
      <ValueCollection
        key={`error-${error.code}`}
        createdBy={chatbotName}
        createdAt={message.createdAt}
        type={MessageValueType.OUTPUT}
        content={[{ text: getErrorMessage(error.code) }]}
        files={null}
        sources={null}
        userOutput={null}
        userInput={null}
        useMessageFile={useMessageFile}
        downloadFile={downloadFile}
        saveFile={saveFile}
        useQueryFiles={useQueryFiles}
      />
    );
  });

  return <>{results}</>;
};

const getDefaultValues = (schema: JsonSchema): any => {
  const isType = (schemaType: any, typeName: string) =>
    Array.isArray(schemaType)
      ? schemaType.includes(typeName)
      : schemaType === typeName;

  if (isType(schema.type, 'object') && schema.properties) {
    const defaults: { [key: string]: any } = {};
    for (const [key, property] of Object.entries(schema.properties)) {
      if ('default' in property) {
        defaults[key] = property.default;
      } else if (isType(property.type, 'object') && property.properties) {
        defaults[key] = getDefaultValues(property as JsonSchema);
      } else if (isType(property.type, 'array') && property.items) {
        defaults[key] = [];
      } else {
        defaults[key] = null;
      }
    }
    return defaults;
  }

  return null;
};

export default ChatMessage;
