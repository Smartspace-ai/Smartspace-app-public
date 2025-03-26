'use client';

import { addBotResponse, addMessage, fetchMessages } from '@/apis/messages';
import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { useWorkspaceThreads } from '@/hooks/use-workspace-threads';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Message } from '../models/message';

export function useWorkspaceMessages() {
  const { activeThread, activeWorkspace } = useSmartSpaceChat();
  const { updateThreadMetadata } = useWorkspaceThreads();
  const queryClient = useQueryClient();
  const previousThreadIdRef = useRef<string | null>(null);
  const [debugActiveThread, setDebugActiveThread] = useState<any>(null);

  // Debug effect to track activeThread changes
  useEffect(() => {
    console.log(
      'activeThread changed in useWorkspaceMessages:',
      activeThread ? `${activeThread.name} (${activeThread.id})` : 'undefined'
    );
    setDebugActiveThread(activeThread);
  }, [activeThread]);

  // Fetch messages for the active thread
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['messages', activeThread?.id],
    queryFn: async () => {
      if (!activeThread) {
        console.log('Query function called but activeThread is undefined');
        return [];
      }

      const threadId = activeThread.id;
      console.log('Fetching messages for thread ID:', threadId);

      try {
        // Store the current thread ID before the async operation
        const currentThreadId = threadId;

        // Fetch messages
        const result = await fetchMessages(currentThreadId);

        // Check if the thread ID is still the same after the async operation
        if (activeThread?.id !== currentThreadId) {
          console.log('Thread changed during fetch, discarding results');
          return [];
        }

        console.log(
          `Fetched ${result.length} messages for thread ID:`,
          currentThreadId
        );
        return result;
      } catch (err) {
        console.error('Error in fetchMessages:', err);
        throw err;
      }
    },
    enabled: !!activeThread,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  // Effect to refetch messages when thread changes - with protection against loops
  useEffect(() => {
    if (activeThread?.id && activeThread.id !== previousThreadIdRef.current) {
      console.log(
        'Thread changed, refetching messages for thread ID:',
        activeThread.id
      );
      previousThreadIdRef.current = activeThread.id;

      // Only refetch if we have a valid thread ID and it's different from the previous one
      refetch().catch((error) => {
        console.error('Error refetching messages:', error);
      });
    } else if (!activeThread) {
      console.log('Active thread is undefined, not refetching messages');
    }
  }, [activeThread, refetch]);

  // Update the mutation to use the Message class
  const addMessageMutation = useMutation({
    mutationFn: ({
      threadId,
      content,
    }: {
      threadId: string;
      content: string;
    }) => {
      // First, create a Promise that will be returned
      return new Promise<Message>((resolve, reject) => {
        // Create an optimistic message
        const optimisticMessage = new Message({
          id: `temp-${Date.now()}`,
          messageThreadId: threadId,
          content: content,
          createdAt: new Date(),
          createdBy: 'You',
          createdByUserId: 'current-user-id',
        });

        // Add the optimistic message to the cache
        queryClient.setQueryData(
          ['messages', threadId],
          (oldMessages: Message[] = []) => [...oldMessages, optimisticMessage]
        );

        // Use a separate async function for the async operations
        const performAsyncOperations = async () => {
          try {
            // Cancel any in-flight queries to avoid race conditions
            await queryClient.cancelQueries({
              queryKey: ['messages', threadId],
            });

            // Make the actual API call
            const response = await addMessage(threadId, content);

            // Update the cache with the real message
            queryClient.setQueryData(
              ['messages', threadId],
              (oldMessages: Message[] = []) => {
                // Filter out the optimistic message
                const filteredMessages = oldMessages.filter(
                  (msg) => msg.id !== optimisticMessage.id
                );
                return [...filteredMessages, response];
              }
            );

            // Update the thread metadata
            updateThreadMetadata(threadId, {
              totalMessages: (activeThread?.totalMessages || 0) + 1,
              lastUpdated: 'Just now',
            });

            resolve(response);
          } catch (error) {
            // Remove the optimistic message on error
            queryClient.setQueryData(
              ['messages', threadId],
              (oldMessages: Message[] = []) =>
                oldMessages.filter((msg) => msg.id !== optimisticMessage.id)
            );
            reject(error);
          }
        };

        // Call the async function
        performAsyncOperations();
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    },
  });

  // Update the bot response mutation to use the Message class
  const addBotResponseMutation = useMutation({
    mutationFn: ({
      threadId,
      threadTitle,
    }: {
      threadId: string;
      threadTitle: string;
    }) => {
      return new Promise<Message>((resolve, reject) => {
        // Create a temporary bot response message
        const tempBotMessage = new Message({
          id: `temp-bot-${Date.now()}`,
          messageThreadId: threadId,
          content: 'Thinking...',
          createdAt: new Date(),
          createdBy: 'SmartSpace',
          createdByUserId: 'smartspace-bot',
        });

        // Add the temporary bot message to the cache
        queryClient.setQueryData(
          ['messages', threadId],
          (oldMessages: Message[] = []) => [...oldMessages, tempBotMessage]
        );

        // Use a separate async function for the async operations
        const performAsyncOperations = async () => {
          try {
            // Make the actual API call
            const response = await addBotResponse(threadId, threadTitle);

            // Update the cache with the real bot response
            queryClient.setQueryData(
              ['messages', threadId],
              (oldMessages: Message[] = []) => {
                // Replace the temporary bot message with the real one
                return oldMessages.map((msg) =>
                  msg.id === tempBotMessage.id ? response : msg
                );
              }
            );

            // Update the thread metadata
            updateThreadMetadata(threadId, {
              totalMessages: (activeThread?.totalMessages || 0) + 1,
              lastUpdated: 'Just now',
            });

            resolve(response);
          } catch (error) {
            // Remove the temporary bot message on error
            queryClient.setQueryData(
              ['messages', threadId],
              (oldMessages: Message[] = []) =>
                oldMessages.filter((msg) => msg.id !== tempBotMessage.id)
            );
            reject(error);
          }
        };

        // Call the async function
        performAsyncOperations();
      });
    },
    onError: (error) => {
      console.error('Error getting bot response:', error);
      toast.error('Failed to get AI response. Please try again.');
    },
  });

  // Function to send a new message and trigger bot response
  const sendMessage = (content: string) => {
    if (!activeThread || !content.trim()) return;

    // Send the user message
    addMessageMutation.mutate(
      {
        threadId: activeThread.id,
        content,
      },
      {
        onSuccess: () => {
          // After the user message is sent, trigger the bot response
          if (activeThread) {
            addBotResponseMutation.mutate({
              threadId: activeThread.id,
              threadTitle: activeThread.name,
            });
          }
        },
      }
    );
  };

  // Function to add input to an existing message (similar to addInputToMessageMutation)
  const addInputToMessage = useMutation({
    mutationFn: ({
      messageId,
      name,
      value,
    }: {
      messageId: string;
      name: string;
      value: any;
    }) => {
      return new Promise<Message>((resolve, reject) => {
        if (!activeThread) {
          reject(new Error('No active thread'));
          return;
        }

        // Update the message in the cache optimistically
        queryClient.setQueryData(
          ['messages', activeThread.id],
          (oldMessages: Message[] = []) => {
            return oldMessages.map((msg) => {
              if (msg.id === messageId) {
                // Add the new input to the message
                const updatedMsg = new Message({
                  ...msg,
                  [name]: value,
                });
                return updatedMsg;
              }
              return msg;
            });
          }
        );

        // Use a separate async function for the async operations
        const performAsyncOperations = async () => {
          try {
            // In a real implementation, you would make an API call here
            // For now, we'll just simulate a successful update
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Since we don't have a real API for this, we'll just resolve with the updated message
            const updatedMessage = queryClient
              .getQueryData<Message[]>(['messages', activeThread.id])
              ?.find((msg) => msg.id === messageId);

            if (!updatedMessage) throw new Error('Message not found');

            resolve(updatedMessage);
          } catch (error) {
            // Revert the optimistic update on error
            queryClient.invalidateQueries({
              queryKey: ['messages', activeThread?.id],
            });
            reject(error);
          }
        };

        // Call the async function
        performAsyncOperations();
      });
    },
    onError: (error) => {
      console.error('Error updating message:', error);
      toast.error('Failed to update message. Please try again.');
    },
  });

  // Update the isLoading calculation to include isFetching
  const isLoadingMessages = isLoading || isFetching;

  return {
    messages,
    isLoading: isLoadingMessages,
    error,
    refetch,
    sendMessage,
    addInputToMessage,
    isSendingMessage: addMessageMutation.isPending,
    isBotResponding: addBotResponseMutation.isPending,
    debugActiveThread, // Expose for debugging
  };
}
