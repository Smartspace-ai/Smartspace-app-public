import type React from 'react';

import { Message } from '@/models/message';
import { MessagesSquare } from 'lucide-react';
import { useContext, useEffect, useRef } from 'react';
import { downloadFile } from '../../../apis/message-threads';
import { useQueryFiles } from '../../../hooks/use-files';
import { saveFile, useMessageFile } from '../../../hooks/use-message-file';
import { UserContext } from '../../../hooks/use-user-information';
import { Draw } from '../../../models/draw';
import { getInitials } from '../../../utils/initials';
import { parseDateTime } from '../../../utils/parse-date-time';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { ScrollArea } from '../../ui/scroll-area';
import { Skeleton } from '../../ui/skeleton';
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
}: ChatBodyProps) {
  // Auto-scroll to bottom when bot starts responding
  const prevBotRespondingRef = useRef(isBotResponding);
  const { graphData } = useContext(UserContext);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isBotResponding, messagesEndRef]);

  return (
    <div className="ss-chat__body flex-1 overflow-y-auto">
      <ScrollArea className="h-full">
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
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <MessagesSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Be the first to start the conversation!
            </p>
          </div>
        ) : (
          // Messages
          <div className="space-y-2 max-w-3xl mx-auto p-2">
            {messages.map((message, index) => (
              <div className="ss-chat__message" key={message.id}>
                <ChatMessage
                  key={message.id}
                  userId={(graphData as any)?.id}
                  avatar={getInitials(message.createdBy ?? 'You')}
                  message={message}
                  messageId={message.id}
                  isLast={index === messages.length - 1}
                  useMessageFile={useMessageFile}
                  downloadFile={downloadFile}
                  saveFile={saveFile}
                  useQueryFiles={useQueryFiles}
                />
              </div>
            ))}

            {isBotResponding && (
              <div className="rounded-lg border bg-background shadow-md mb-4 group">
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 mt-0.5">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getInitials('Chatbot')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">Chatbot</span>
                      <span className="text-xs text-muted-foreground">
                        {parseDateTime(new Date(), 'Do MMMM YYYY, h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 min-h-3">
                  <div className="flex space-x-2 p-1">
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
      </ScrollArea>
    </div>
  );
}
