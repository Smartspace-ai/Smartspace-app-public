import { JsonSchema } from '@jsonforms/core';
import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import _ from 'lodash';
import { Copy } from 'lucide-react';
import { FC, ReactNode, useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';
import {
  Message,
  MessageContent,
  MessageFile,
  MessageValueType,
} from '../../../models/message';
import { MessageResponseSource } from '../../../models/message-response-source';
import { getInitials } from '../../../utils/initials';
import { parseDateTime } from '../../../utils/parse-date-time';
import { MyMarkdown } from '../../markdown/my-markdown';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { ChatMessageImage } from '../chat-message-image/chat-message-image';
import { ChatMessageSources } from '../chat-message-sources/chat-message-sources';

export interface ContentItem {
  text?: string;
  image?: MessageFile;
}

interface MessageValueProps {
  createdBy: string;
  createdAt: Date | string;
  type: MessageValueType;
  content: MessageContent[] | null;
  sources: MessageResponseSource[] | null;
  userOutput: { message: string; schema: Record<string, any> } | null;
  userInput?: any;
  files: MessageFile[] | null;
  position?: 'left' | 'right';
  containerRef: React.MutableRefObject<any | null>;
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
    userOutput,
    userInput,
    useQueryFiles,
    useMessageFile,
    addValueToMessage,
  } = props;
  const [responseFormData, setResponseFormData] = useState<any>(userInput);
  const [responseFormValid, setResponseFormValid] = useState<boolean>(false);
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isBotResponse = type === MessageValueType.OUTPUT;

  const showForm = userOutput && addValueToMessage;

  useEffect(() => {
    if (!userOutput || userInput !== undefined) return;

    const defaultValues = getDefaultValues(userOutput.schema as JsonSchema);
    setResponseFormData(defaultValues);
  }, [userOutput, userInput]);

  return (
    <div
      className={cn(
        isBotResponse ? 'border bg-background shadow-md' : '',
        'rounded-lg mb-4 group'
      )}
    >
      {/* Message header with avatar, name, time, and actions */}
      <div
        className={cn(
          isBotResponse ? 'border-b' : '',
          'flex items-center justify-between p-3 '
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
              {getInitials(isBotResponse ? 'Chatbot' : createdBy)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-medium">
              {isBotResponse ? 'Chatbot' : createdBy}
            </span>
            <span className="text-xs text-muted-foreground">
              {createdAt
                ? parseDateTime(createdAt, 'Do MMMM YYYY, h:mm a')
                : ''}
            </span>
          </div>
        </div>

        {/* Action buttons - simplified to only Preview/Raw toggle and Copy */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              isBotResponse
                ? ''
                : 'hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity',
              'h-7 w-7 text-muted-foreground hover:text-foreground'
            )}
            title="Copy"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Message content */}
      <div className={cn(isBotResponse ? 'p-3' : 'px-3 py-1')}>
        <div className="prose prose-sm max-w-none dark:prose-invert text-sm">
          {content &&
            (content as MessageContent[]).map((item, i) => {
              if (item.text) {
                return <MyMarkdown key={`content-${i}`} text={item.text} />;
              } else if (item.image) {
                return (
                  <ChatMessageImage
                    key={`image-${i}`}
                    image={item.image}
                    name={item.image.name}
                    useMessageFile={useMessageFile}
                  />
                );
              }
              return null;
            })}

          {/* Form section */}
          {showForm && (
            <div className="mt-4 pt-4 border-t border-border">
              <JsonForms
                schema={userOutput.schema as JsonSchema}
                data={responseFormData}
                renderers={materialRenderers}
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
                  disabled={!responseFormValid}
                  onClick={() => addValueToMessage?.('_user', responseFormData)}
                >
                  Send
                </Button>
              </div>
            </div>
          )}

          {/** Sources */}
          {(sources || []).map((source, idx) => (
            <ChatMessageSources
              key={idx}
              source={source}
              useQueryFiles={useQueryFiles}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ChatMessageProps {
  userId: string;
  avatar?: string | JSX.Element;
  message: Message;
  containerRef: React.MutableRefObject<any | null>;
  messageId?: string;
  isLast?: boolean;
  responseData?: any | null;
  useMessageFile: (id: string) => {
    useMessageFileRaw: UseQueryResult<Blob, Error>;
  };

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

export const ChatMessage: FC<ChatMessageProps> = (props) => {
  const {
    userId,
    message,
    containerRef,
    useQueryFiles,
    downloadFile,
    saveFile,
    useMessageFile,
  } = props;

  const values =
    message.values?.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ) || [];

  // We will store the <ValueCollection> components in this array
  const results: ReactNode[] = [];

  let content: ContentItem[] | null = null;
  let sources: any[] | null = null;
  let files: MessageFile[] | null = null;
  let requestedSchema: Record<string, any> | null = null;
  let currentType: MessageValueType = MessageValueType.INPUT;
  let createdAt: Date | string = '';
  let createdBy = '';
  let valuesSavedToCollection = false;
  let channels: Record<string, number> = {};

  // We need a stable key each time we push a <ValueCollection>.
  // We'll track an index so each push can include a unique key.
  let collectionKey = 0;

  const addValueToContent = (value: any) => {
    if (content === null) {
      content = [];
    }

    if (typeof value === 'string') {
      content.push({ text: value });
    } else if (
      Array.isArray(value) &&
      value.every((v) => v.text !== undefined || v.image !== undefined)
    ) {
      content = content.concat(value);
    } else if (value.text || value.image) {
      content.push(value);
    } else {
      content.push({ text: JSON.stringify(value) });
    }
  };

  // Helper to "commit" the current content/files/etc. as a ValueCollection
  const saveCollection = (nextType: MessageValueType) => {
    results.push(
      <ValueCollection
        key={`collection-${collectionKey++}`}
        createdBy={createdBy}
        createdAt={createdAt}
        type={currentType}
        content={content}
        files={files}
        sources={sources}
        userInput={null}
        userOutput={null}
        containerRef={containerRef}
        useMessageFile={useMessageFile}
        downloadFile={downloadFile}
        saveFile={saveFile}
        useQueryFiles={useQueryFiles}
      />
    );

    // Reset for next collection
    content = null;
    files = null;
    sources = null;
    requestedSchema = null;
    currentType = nextType;
    valuesSavedToCollection = true;
    channels = {};
  };

  if (values.length) {
    for (const value of values) {
      if (currentType === null) {
        currentType = value.type;
      }

      // If we detect a type change mid-iteration, "commit" the previous chunk before continuing
      if (currentType !== value.type) {
        if (!valuesSavedToCollection) {
          saveCollection(value.type);
        }
        currentType = value.type;
      }

      // Collect channel indexes (we use them for addValueToMessage)
      const updateChannels = ([ch, index]: [string, number]) => {
        if (!channels[ch] || index > channels[ch]) {
          channels[ch] = index;
        }
      };

      Object.entries(value.channels).forEach(updateChannels);

      let skip = false;
      if (value.value != null) {
        const valueName = value.name.toLowerCase();

        switch (valueName) {
          case 'prompt':
          case 'response':
          case 'content':
            if (content) {
              saveCollection(value.type);
            }
            if (
              valueName === 'response' &&
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
            skip = true;
            if (!valuesSavedToCollection) {
              saveCollection(value.type);
            }

            if (value.type === MessageValueType.INPUT) {
              break;
            } else {
              // Look for the matching _user for input
              const userInput = values.find(
                (v) =>
                  v.name === '_user' &&
                  v.type === MessageValueType.INPUT &&
                  _.isEqual(v.channels, value.channels)
              );

              results.push(
                <ValueCollection
                  key={`collection-${collectionKey++}`}
                  createdBy={createdBy}
                  createdAt={createdAt}
                  type={currentType}
                  content={[{ text: value.value.message }]}
                  files={[]}
                  sources={[]}
                  userOutput={value.value}
                  userInput={userInput?.value}
                  containerRef={containerRef}
                  useMessageFile={useMessageFile}
                  downloadFile={downloadFile}
                  saveFile={saveFile}
                  useQueryFiles={useQueryFiles}
                />
              );
            }
            break;

          case 'files':
            if (value.value) {
              if (files) {
                saveCollection(value.type);
              }
              if (value.value.length) {
                files = value.value;
              } else {
                files = [value.value];
              }
              valuesSavedToCollection = false;
            }
            break;

          case 'sources':
            if (sources) {
              saveCollection(value.type);
            }
            sources = value.value;
            valuesSavedToCollection = false;
            break;

          case 'userinfo':
            skip = true;
            break;

          default:
            if (content) {
              saveCollection(value.type);
            }
            addValueToContent(value.value);
            break;
        }
      }

      if (!skip) {
        valuesSavedToCollection = false;
        createdAt = value.createdAt;
        createdBy = value.createdBy;
      }
    }
  }

  // If there's uncommitted data after the loop, push it
  if (!valuesSavedToCollection) {
    results.push(
      <ValueCollection
        key={`collection-final-${collectionKey++}`}
        createdBy={createdBy}
        createdAt={createdAt}
        type={currentType}
        content={content}
        files={files}
        sources={sources}
        userOutput={null}
        userInput={null}
        containerRef={containerRef}
        useMessageFile={useMessageFile}
        downloadFile={downloadFile}
        saveFile={saveFile}
        useQueryFiles={useQueryFiles}
      />
    );
  }

  return results;
};

const getDefaultValues = (schema: JsonSchema): any => {
  const isType = (schemaType: any, typeName: string) => {
    if (Array.isArray(schemaType)) {
      return schemaType.includes(typeName);
    }
    return schemaType === typeName;
  };

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
