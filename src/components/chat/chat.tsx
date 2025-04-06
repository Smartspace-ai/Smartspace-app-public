'use client';

import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { AnimatePresence, motion } from 'framer-motion';
import { Upload } from 'lucide-react';
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

  // Update state for multiple images
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // Add state for drag and drop at the top of the Chat component, after other state declarations
  const [isDraggingOverChat, setIsDraggingOverChat] = useState(false);

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

    sendMessage(newMessage, [{ text: newMessage }]);
    setNewMessage('');
    if (activeThread) {
      clearDraft(activeThread.id);
    }
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

  // Add these drag event handlers before the return statement
  const handleDragEnterChat = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverChat(true);
  };

  const handleDragLeaveChat = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the chat area (not entering a child element)
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOverChat(false);
  };

  const handleDragOverChat = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropChat = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverChat(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const imageFiles = filesArray.filter((file) =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length === 0) {
        toast.error('Please drop image files');
        return;
      }

      setSelectedImages([...selectedImages, ...imageFiles]);
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-gradient-to-b from-background from-10% via-background via-50% to-primary/10 to-100%"
      onDragEnter={handleDragEnterChat}
      onDragLeave={handleDragLeaveChat}
      onDragOver={handleDragOverChat}
      onDrop={handleDropChat}
    >
      <ChatHeader />
      {/* Modern drop zone overlay with animation */}
      <AnimatePresence>
        {isDraggingOverChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 backdrop-blur-sm bg-background/70 z-20 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-background/80 p-8 rounded-2xl shadow-lg border border-primary/20 backdrop-blur-md"
            >
              <div className="rounded-full bg-primary/10 p-5 mb-5 mx-auto w-20 h-20 flex items-center justify-center">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-medium mb-3 text-center">
                Drop images here
              </h3>
              <p className="text-muted-foreground text-center max-w-xs">
                Release to upload your images to the conversation
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        disabled={isSendingMessage}
        selectedImages={selectedImages}
        setSelectedImages={setSelectedImages}
      />
    </div>
  );
}

export default Chat;
