import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { useWorkspaceMessages } from '@/hooks/use-workspace-messages';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { MessageCreateContent } from '../../models/message';
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
    uploadFiles,
    isSendingMessage,
    isBotResponding,
    isUploadingFiles,
    addValueToMessage,
  } = useWorkspaceMessages(activeWorkspace, activeThread);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState(() =>
    activeThread ? getDraft(activeThread.id) : ''
  );

  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isDraggingOverChat, setIsDraggingOverChat] = useState(false);

  // Scroll to bottom on message change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length]);

  // Save draft on message change
  useEffect(() => {
    if (activeThread) {
      saveDraft(activeThread.id, newMessage);
    }
  }, [newMessage, activeThread, saveDraft]);

  // Copy to clipboard handler
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

  // File upload handler
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (!activeThread) return;

      try {
        const result = await uploadFiles(files);
        if (Array.isArray(result)) {
          setUploadedFiles((prev) => [...prev, ...result]);
        } else {
          console.error('uploadFiles did not return an array');
        }
        toast.success(
          `${files.length} file${
            files.length > 1 ? 's' : ''
          } uploaded successfully`
        );
      } catch (error) {
        console.error('File upload error:', error);
        toast.error('Failed to upload files');
      }
    },
    [uploadFiles, activeThread]
  );

  // Send message handler
  const handleSendMessage = useCallback(() => {
    if ((!newMessage.trim() && uploadedFiles.length === 0) || !activeThread)
      return;

    const contentList: MessageCreateContent[] = [];

    if (newMessage.trim()) {
      contentList.push({ text: newMessage.trim() });
    }

    sendMessage(newMessage.trim(), contentList, uploadedFiles);

    setNewMessage('');
    setSelectedFiles([]);
    setUploadedFiles([]);
    clearDraft(activeThread.id);
  }, [newMessage, uploadedFiles, activeThread, sendMessage, clearDraft]);

  // Submit on Enter (not Shift+Enter)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Drag-and-drop handlers
  const handleDragEnterChat = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverChat(true);
  };

  const handleDragLeaveChat = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

    if (e.dataTransfer.files?.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      handleFilesSelected(filesArray);
    }
  };

  return (
    <div
      className="ss-chat flex flex-col h-full border bg-card text-card-foreground shadow-sm bg-gradient-to-b from-background from-10% via-background via-50% to-primary/20 to-100%"
      onDragEnter={handleDragEnterChat}
      onDragLeave={handleDragLeaveChat}
      onDragOver={handleDragOverChat}
      onDrop={handleDropChat}
    >
      <ChatHeader />

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
                Drop files here
              </h3>
              <p className="text-muted-foreground text-center max-w-xs">
                Release to upload your files to the conversation
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
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        isUploadingFiles={isUploadingFiles}
        onFilesSelected={handleFilesSelected}
      />
    </div>
  );
}

export default Chat;
