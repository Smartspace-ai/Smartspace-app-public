'use client';

import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useWorkspaceMessages } from '../../hooks/use-workspace-messages';
import ChatBody from './chat-body/chat-body';
import ChatComposer from './chat-composer/chat-composer';
import ChatHeader from './chat-header/chat-header';

export function Chat() {
  const { activeWorkspace, activeThread, getDraft, saveDraft, clearDraft } =
    useSmartSpaceChat();

  const {
    messages,
    isLoading,
    sendMessage,
    isSendingMessage,
    isBotResponding,
    addInputToMessageMutation,
  } = useWorkspaceMessages(activeWorkspace, activeThread);

  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState(() =>
    activeThread ? getDraft(activeThread.id) : ''
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Save draft as user types
  useEffect(() => {
    if (activeThread) {
      saveDraft(activeThread.id, newMessage);
    }
  }, [newMessage, activeThread, saveDraft]);

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

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() === '') return;
    if (!activeThread) return;

    sendMessage(newMessage, [{ text: newMessage }]);
    setNewMessage('');
    clearDraft(activeThread.id);
  }, [newMessage, activeThread, sendMessage, clearDraft]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

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
      <ChatHeader />

      <ChatBody
        messages={messages}
        copiedMessageId={copiedMessageId}
        messagesEndRef={messagesEndRef}
        copyMessageToClipboard={copyMessageToClipboard}
        isLoading={isLoading}
        isSendingMessage={isSendingMessage}
        isBotResponding={isBotResponding}
        commentsDraw={{} as any}
        waitingResponse={false}
        addValueToMessage={addValueToMessage}
      />

      <ChatComposer
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleKeyDown={handleKeyDown}
        isSending={isSendingMessage}
        disabled={!activeThread || isSendingMessage}
      />
    </div>
  );
}

export default Chat;
