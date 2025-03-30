'use client';

import type React from 'react';

import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { useWorkspaceMessages } from '@/hooks/use-workspace-messages';
import { useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';
import ChatBody from './chat-body/chat-body';
import ChatComposer from './chat-composer/chat-composer';
import ChatHeader from './chat-header/chat-header';

export function Chat() {
  const { activeWorkspace, activeThread } = useSmartSpaceChat();
  const {
    messages,
    isLoading,
    sendMessage,
    isSendingMessage,
    isBotResponding,
  } = useWorkspaceMessages();
  const [messageInput, setMessageInput] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]); // Only depend on messages.length, not the entire messages array

  // Function to copy message content to clipboard
  const copyMessageToClipboard = (message: string, id: number) => {
    navigator.clipboard.writeText(message).then(
      () => {
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
        toast.success('Copied to clipboard');
      },
      () => {
        toast.error('Failed to copy to clipboard');
      }
    );
  };

  // Function to handle message submission
  const handleSendMessage = () => {
    if (messageInput.trim() && activeThread) {
      sendMessage(messageInput.trim());
      setMessageInput('');
      // Focus the textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  // Function to handle key press in textarea
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const { postMessageMutation, addInputToMessageMutation } =
    useWorkspaceMessages(activeWorkspace, activeThread);

  const addValueToMessage = (
    messageId: string,
    name: string,
    value: any,
    channels: Record<string, number>
  ) => {
    addInputToMessageMutation.mutate({ messageId, name, value, channels });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-100">
      {/* Chat Header */}
      <ChatHeader />

      {/* Chat messages */}
      <ChatBody
        messages={messages}
        copiedMessageId={copiedMessageId}
        messagesEndRef={messagesEndRef}
        copyMessageToClipboard={copyMessageToClipboard}
        isLoading={isLoading}
        isBotResponding={isBotResponding}
        commentsDraw={{} as any}
        waitingResponse={false}
        addValueToMessage={addValueToMessage}
      />

      <ChatComposer
        newMessage={''}
        setNewMessage={function (message: string): void {
          throw new Error('Function not implemented.');
        }}
        handleSendMessage={function (): void {
          throw new Error('Function not implemented.');
        }}
        handleKeyDown={function (e: React.KeyboardEvent): void {
          throw new Error('Function not implemented.');
        }}
        isSending={false}
        disabled={false}
      ></ChatComposer>
    </div>
  );
}

export default Chat;
