'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type React from 'react';
import { Message } from '../../../models/message';
import ChatMessage from '../chat-message/chat-message';

type ChatBodyProps = {
  messages: Message[];
  copiedMessageId: number | null;
  rawModeMessages: number[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  copyMessageToClipboard: (message: string, id: number) => void;
  handleEditMessage: (id: number) => void;
  handleDeleteMessage: (id: number) => void;
  toggleRawMode: (id: number) => void;
  isRawMode: (id: number) => boolean;
  getMessageContent: (message: any) => string;
  isLoading: boolean;
  isBotResponding: boolean;
  onAddReaction?: (messageId: string, reaction: string) => void;
};

export default function ChatBody({
  messages,
  copiedMessageId,
  rawModeMessages,
  messagesEndRef,
  copyMessageToClipboard,
  handleEditMessage,
  handleDeleteMessage,
  toggleRawMode,
  isRawMode,
  getMessageContent,
  isLoading,
  isBotResponding,
  onAddReaction,
}: ChatBodyProps) {
  // If loading, show skeleton loaders
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto w-full px-4">
        <div className="max-w-3xl mx-auto w-full py-4 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full px-4">
      <div className="max-w-3xl mx-auto w-full py-4 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className="group">
            <ChatMessage
              message={message}
              copiedMessageId={copiedMessageId}
              isRawMode={isRawMode(Number(message.id))}
              copyMessageToClipboard={copyMessageToClipboard}
              handleEditMessage={handleEditMessage}
              handleDeleteMessage={handleDeleteMessage}
              toggleRawMode={toggleRawMode}
              getMessageContent={getMessageContent}
              onAddReaction={onAddReaction}
            />
          </div>
        ))}

        {/* Show typing indicator if bot is responding */}
        {isBotResponding && (
          <div className="rounded-lg border bg-background shadow-md p-3 pl-12 animate-pulse">
            <div className="flex space-x-2">
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"></div>
            </div>
          </div>
        )}

        {/* This div is used to scroll to the bottom of the messages */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
