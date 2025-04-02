import type React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import type { Message } from '@/models/message';
import { useContext, useEffect, useRef } from 'react';
import type SimpleBarCore from 'simplebar-core';
import { downloadFile } from '../../../apis/message-threads';
import { useQueryFiles } from '../../../hooks/use-files';
import { saveFile, useMessageFile } from '../../../hooks/use-message-file';
import { UserContext } from '../../../hooks/use-user-information';
import { Draw } from '../../../models/draw';
import { getInitials } from '../../../utils/initials';
import ChatMessage from '../chat-message/chat-message';

interface ChatBodyProps {
  messages: Message[];
  copiedMessageId: number | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  copyMessageToClipboard: (message: string, id: number) => void;
  isLoading: boolean;
  isBotResponding: boolean;
  isSendingMessage: boolean;
  commentsDraw: Draw;
  waitingResponse: boolean;
  addValueToMessage: (
    messageId: string,
    name: string,
    value: any,
    channels: Record<string, number>
  ) => void;
}

export default function ChatBody({
  messages,
  copiedMessageId,
  messagesEndRef,
  copyMessageToClipboard,
  isLoading,
  isBotResponding,
  isSendingMessage,
  commentsDraw,
  waitingResponse,
  addValueToMessage,
}: ChatBodyProps) {
  // Auto-scroll to bottom when bot starts responding
  const prevBotRespondingRef = useRef(isBotResponding);
  const { graphData } = useContext(UserContext);

  useEffect(() => {
    if (!prevBotRespondingRef.current && isBotResponding) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevBotRespondingRef.current = isBotResponding;
  }, [isBotResponding, messagesEndRef]);

  const scrollRef = useRef<SimpleBarCore | null>(null);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {isLoading ? (
        // Loading skeleton
        <div className="space-y-8 max-w-3xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        // No messages state
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <p className="text-muted-foreground">
            There are no messages in this thread yet. Start a conversation!
          </p>
        </div>
      ) : (
        // Messages
        <div className="space-y-2 max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <div key={message.id}>
              <ChatMessage
                key={message.id}
                userId={(graphData as any)?.id}
                avatar={getInitials(message.createdBy ?? 'You')}
                message={message}
                containerRef={scrollRef}
                messageId={message.id}
                isLast={index === messages.length - 1}
                useMessageFile={useMessageFile}
                downloadFile={downloadFile}
                saveFile={saveFile}
                useQueryFiles={useQueryFiles}
                addValueToMessage={addValueToMessage}
              />
            </div>
          ))}

          {isBotResponding && (
            <div className="rounded-lg border bg-background shadow-md p-3 mb-8 mt-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                  SS
                </div>
                <span className="text-sm font-medium">SmartSpace</span>
                <span className="text-xs text-muted-foreground">Just now</span>
              </div>
              <div className="pl-8">
                <div className="flex space-x-2">
                  <div
                    className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                    style={{ animationDelay: '600ms' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      )}
    </div>
  );
}
