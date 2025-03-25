'use client';

import { Button } from '@/components/ui/button';
import { Copy, MessageSquare } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSmartSpaceChat } from '../../contexts/smartspace-context';
import { useWorkspaceMessages } from '../../hooks/use-workspace-messages';
import ChatBody from './chat-body/chat-body';
import ChatComposer from './chat-composer/chat-composer';
import ChatHeader from './chat-header/chat-header';

export function ChatArea() {
  const { activeThread, activeWorkspace } = useSmartSpaceChat();
  const {
    messages,
    isLoading: isLoadingMessages,
    sendMessage,
    isSendingMessage,
    isBotResponding,
  } = useWorkspaceMessages();

  // Get local drafts from context
  const { getDraft, saveDraft, clearDraft } = useSmartSpaceChat();

  // Debug the ChatArea component to ensure the header and messages are rendering properly
  console.log(
    'ChatArea rendering - activeThread:',
    activeThread?.title,
    'messages:',
    messages?.length,
    'isLoadingMessages:',
    isLoadingMessages
  );

  // Initialize newMessage with any saved draft
  const [newMessage, setNewMessage] = useState(() =>
    activeThread ? getDraft(activeThread.id) : ''
  );

  // Update draft when message changes
  useEffect(() => {
    if (activeThread && newMessage) {
      saveDraft(activeThread.id, newMessage);
    }
  }, [newMessage, activeThread, saveDraft]);

  // Load draft when thread changes
  useEffect(() => {
    if (activeThread) {
      setNewMessage(getDraft(activeThread.id));
    } else {
      setNewMessage('');
    }
  }, [activeThread, getDraft]);

  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [rawModeMessages, setRawModeMessages] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on initial load and when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset copied state after a delay
  useEffect(() => {
    if (copiedMessageId !== null) {
      const timer = setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedMessageId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    if (!activeThread) return;

    sendMessage(newMessage);
    setNewMessage('');
    clearDraft(activeThread.id); // Clear draft after sending
    toast.success('Message sent');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessageToClipboard = (message: string, id: number) => {
    navigator.clipboard.writeText(message).then(() => {
      setCopiedMessageId(id);
      toast('Message copied to clipboard', {
        icon: <Copy className="h-4 w-4" />,
        duration: 2000,
      });
    });
  };

  const handleEditMessage = (id: number) => {
    // Placeholder for edit functionality
    toast.info('Edit functionality would be implemented here', {
      icon: <span>✏️</span>,
    });
  };

  const handleDeleteMessage = (id: number) => {
    // Placeholder for delete functionality
    toast.info('Delete functionality would be implemented here', {
      icon: <span>🗑️</span>,
    });
  };

  const toggleRawMode = (id: number) => {
    setRawModeMessages((prev) =>
      prev.includes(id)
        ? prev.filter((messageId) => messageId !== id)
        : [...prev, id]
    );
  };

  const isRawMode = (id: number) => rawModeMessages.includes(id);

  // Function to get message content (with HTML for bot messages)
  const getMessageContent = (message: any) => {
    // For demonstration, we'll use sample HTML content for bot messages
    // In a real app, this would come from your API
    if (!message.isCurrentUser) {
      return message.content;
    }
    return message.content;
  };

  // Check if we have an active thread but no messages
  const hasEmptyThread =
    activeThread && messages.length === 0 && !isLoadingMessages;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Always render the ChatHeader with no conditions */}
      <ChatHeader />

      {/* Chat Content Area with gradient background */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-gradient-to-bl from-[hsl(var(--primary)/0.05)] to-transparent">
        {/* Right inward shadow */}
        <div
          className="absolute top-0 right-0 bottom-0 w-4 pointer-events-none z-10"
          style={{ boxShadow: 'inset -5px 0 5px -5px rgba(0, 0, 0, 0.1)' }}
        ></div>

        {/* Empty state when no thread is selected */}
        {!activeThread && !isLoadingMessages && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Welcome to SmartSpace
            </h2>
            <p className="text-gray-500 mb-6 max-w-md">
              Select a thread from the sidebar to start chatting or create a new
              thread to begin a conversation.
            </p>
          </div>
        )}

        {/* Empty state when thread is selected but has no messages */}
        {hasEmptyThread && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {activeWorkspace?.name}
            </h2>
            <h3 className="text-lg text-gray-700 mb-2">{activeThread.title}</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              There are no messages in this thread yet. Start a conversation by
              asking SmartSpace anything.
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => {
                setNewMessage(
                  'Hello SmartSpace! Can you help me with this thread?'
                );
                // Focus the composer
                const textarea = document.querySelector('textarea');
                if (textarea) {
                  textarea.focus();
                }
              }}
            >
              Start conversation
            </Button>
          </div>
        )}

        {/* Chat Body - only show if we have messages or are loading */}
        {(messages.length > 0 || isLoadingMessages) && (
          <ChatBody
            messages={messages}
            copiedMessageId={copiedMessageId}
            rawModeMessages={rawModeMessages}
            messagesEndRef={messagesEndRef}
            copyMessageToClipboard={copyMessageToClipboard}
            handleEditMessage={handleEditMessage}
            handleDeleteMessage={handleDeleteMessage}
            toggleRawMode={toggleRawMode}
            isRawMode={isRawMode}
            getMessageContent={getMessageContent}
            isLoading={isLoadingMessages}
            isBotResponding={isBotResponding}
          />
        )}

        {/* Chat Composer */}
        <ChatComposer
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          handleKeyDown={handleKeyDown}
          isSending={isSendingMessage}
          disabled={!activeThread || isSendingMessage}
        />
      </div>
    </div>
  );
}

export default ChatArea;
