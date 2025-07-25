import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { MessagesSquare } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Draw } from '@/models/draw';
import { Message, MessageValueType } from '@/models/message';
import { useQueryFiles } from '../../../hooks/use-files';
import { saveFile, useMessageFile } from '../../../hooks/use-message-file';
import { getInitials } from '../../../utils/initials';
import { parseDateTime } from '../../../utils/parse-date-time';

import { downloadFile } from '@/apis/files';
import { useActiveUser } from '@/hooks/use-active-user';
import { useActiveWorkspace } from '@/hooks/use-workspaces';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Skeleton } from '../../ui/skeleton';
import ChatMessage from '../chat-message/chat-message';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatBodyProps {
  messages: Message[];
  copiedMessageId: number | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  copyMessageToClipboard: (message: string, id: number) => void;
  isVisible: boolean;
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
  messagesEndRef,
  isVisible,
  isLoading,
  isBotResponding,
  addValueToMessage,
}: ChatBodyProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollTopRef = useRef<number>(0);
  const activeWorkspace = useActiveWorkspace();
  const activeUser = useActiveUser();
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (isVisible && viewportRef.current) {
      viewportRef.current.scrollTo({top: scrollTopRef.current, behavior: 'instant'});
    }
  }, [isVisible, viewportRef.current]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const observer = new window.ResizeObserver(() => {
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    observer.observe(content);

    return () => observer.disconnect();
  }, [contentRef.current, messagesEndRef.current, isAtBottom]);

  if (isLoading) {
    return (
      <div className="ss-chat__body flex-1 overflow-y-auto">
        <div className="space-y-8 max-w-3xl mx-auto p-4">
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
      </div>
    );
  }
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <MessagesSquare className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">{activeWorkspace?.name ?? 'No messages yet'}</h3>


        {activeWorkspace?.firstPrompt && (
  <div className="max-w-3xl mx-auto p-4 whitespace-pre-wrap">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {activeWorkspace.firstPrompt}
    </ReactMarkdown>
  </div>
)}
      </div>
    );
  }

  const messageHasSomeResponse = messages.length && messages[messages.length - 1].values?.some(v => v.type === MessageValueType.OUTPUT)

  return (
    <div className="ss-chat__body flex-1 h-full w-full overflow-hidden">
      <ScrollAreaPrimitive.Root className="relative overflow-hidden h-full w-full">
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          className="h-full w-full rounded-[inherit] overflow-y-auto"
          onScroll={() => {
            if (!viewportRef.current) return;
            const viewport = viewportRef.current;
            
            scrollTopRef.current = viewport.scrollTop;

            const threshold = 60; // px from bottom to still count as 'at bottom'
            setIsAtBottom(viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < threshold);
          }}
        >
          <div ref={contentRef} className="flex flex-col w-full">
            {messages.map((message, index) => (
              <div
                className="ss-chat__message w-full px-2 max-w-3xl mx-auto"
                key={message.id || index}
              >
                <ChatMessage
                  userId={activeUser.id}
                  avatar={getInitials(message.createdBy ?? 'You')}
                  message={message}
                  messageId={message.id}
                  isLast={index === messages.length - 1}
                  useMessageFile={useMessageFile}
                  downloadFile={downloadFile}
                  saveFile={saveFile}
                  useQueryFiles={useQueryFiles}
                  addValueToMessage={addValueToMessage}
                />

                {index === messages.length - 1 && isBotResponding && (
                  messageHasSomeResponse? 
                    <div className="p-3 min-h-3">
                      <div className="flex space-x-2 p-1">
                        {[0, 300, 600].map((delay) => (
                          <div
                            key={delay}
                            className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  :
                    <div className="rounded-lg border bg-background shadow-md mb-4 group mt-4">
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
                          {[0, 300, 600].map((delay) => (
                            <div
                              key={delay}
                              className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                <div ref={messagesEndRef} className="h-4" />
              </div>
            ))}
          </div>
        </ScrollAreaPrimitive.Viewport>

        <ScrollAreaPrimitive.Scrollbar
          orientation="vertical"
          className="flex touch-none select-none transition-colors h-full w-2.5 border-l border-l-transparent p-[1px]"
        >
          <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
        </ScrollAreaPrimitive.Scrollbar>

        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </div>
  );
}
