
import type { InfiniteData } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { useSendMessage } from '@/domains/messages/mutations';
import { messagesKeys } from '@/domains/messages/queryKeys';
import type { MessageThread } from '@/domains/threads';
import type { ThreadsResponse } from '@/domains/threads/model';
import { threadDetailOptions, useThread } from '@/domains/threads/queries';
import {
  threadsKeys,
  THREAD_LIST_PAGE_SIZE,
} from '@/domains/threads/queryKeys';
import { useWorkspace } from '@/domains/workspaces/queries';

import { usePendingThreads } from '@/ui/threads/PendingThreadsContext';

import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useSidebar } from '@/shared/ui/mui-compat/sidebar';
import { createThreadId } from '@/shared/utils/threadId';

/** Public shape exported to the UI component */
export type MessageComposerVm = ReturnType<typeof useMessageComposerVm>;

export type MessageComposerVmProps = {
  hasAttachments?: boolean;
  isUploadingFiles?: boolean;
}; // optional inbound props for attachments-owned-by-UI

export function useMessageComposerVm(props: MessageComposerVmProps = {}) {
  const { workspaceId, threadId, isNewThreadRoute } = useRouteIds();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addPendingThread, removePendingThread, updatePendingThread } =
    usePendingThreads();
  const [isDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExpand] = useState(false);

  // Message + attachments state (owned by VM)
  const [newMessage, setNewMessage] = useState('');
  const [variables, setVariables] = useState<Record<string, unknown>>({});

  // Data/UX context
  const isMobile = useIsMobile();
  const { leftOpen, rightOpen } = useSidebar();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: thread } = useThread({ workspaceId, threadId });

  const isUploadingFiles = props.isUploadingFiles ?? false;

  // Expand affordance handled by editor styling; keep default false

  /** Derived: can we send? */
  const sendDisabled = useMemo(() => {
    const nothingToSend = !newMessage.trim() && !props.hasAttachments;
    const flowBlocked = !!thread?.isFlowRunning;
    return isUploadingFiles || flowBlocked || nothingToSend;
  }, [
    isUploadingFiles,
    thread?.isFlowRunning,
    newMessage,
    props.hasAttachments,
  ]);

  // Send message
  const sendMessage = useSendMessage();

  const internalSend = (files?: { id: string; name: string }[]) => {
    if (!workspaceId) return;
    if (isNewThreadRoute && !newMessage.trim() && !props.hasAttachments) return;

    const contentList = newMessage.trim()
      ? [{ text: newMessage.trim(), image: undefined }]
      : undefined;
    const vars =
      variables && Object.keys(variables).length > 0 ? variables : undefined;

    if (isNewThreadRoute) {
      const guid = createThreadId();
      const now = new Date();
      const pendingThread: MessageThread = {
        id: guid,
        name: 'New Thread',
        createdAt: now,
        createdBy: 'me',
        createdByUserId: '',
        isFlowRunning: false,
        lastUpdatedAt: now,
        lastUpdatedByUserId: '',
        totalMessages: 0,
        favorited: false,
        workSpaceId: workspaceId,
      };
      const optimisticThread: MessageThread = {
        ...pendingThread,
        isFlowRunning: true,
      };
      queryClient.setQueryData(
        threadDetailOptions({ workspaceId, threadId: guid }).queryKey,
        optimisticThread
      );
      // Update list cache *before* navigate so the new page reads it immediately.
      // (After navigation we're under a different PendingThreadsProvider with empty state.)
      const listKey = threadsKeys.list(workspaceId, {
        take: THREAD_LIST_PAGE_SIZE,
      });
      queryClient.setQueryData<InfiniteData<ThreadsResponse>>(
        listKey,
        (old) => {
          if (!old?.pages?.length) {
            return {
              pages: [{ data: [optimisticThread], total: 1 }],
              pageParams: [0],
            };
          }
          const [firstPage, ...restPages] = old.pages;
          const alreadyHas = firstPage.data.some(
            (t) => t.id === optimisticThread.id
          );
          if (alreadyHas) return old;
          const newFirstPage: ThreadsResponse = {
            data: [optimisticThread, ...firstPage.data],
            total: firstPage.total + 1,
          };
          return {
            ...old,
            pages: [newFirstPage, ...restPages],
          };
        }
      );
      addPendingThread(pendingThread);
      sendMessage.mutate(
        { workspaceId, threadId: guid, contentList, files, variables: vars },
        {
          onSuccess: () => {
            updatePendingThread(guid, { id: guid, isFlowRunning: true });
          },
          onError: () => {
            removePendingThread(guid);
            queryClient.removeQueries({
              queryKey: threadsKeys.detail(workspaceId, guid),
            });
            queryClient.setQueryData(messagesKeys.list(guid), []);
            toast.error('Failed to send message');
            navigate({
              to: '/workspace/$workspaceId/thread/new',
              params: { workspaceId },
              replace: true,
            });
          },
        }
      );
      navigate({
        to: '/workspace/$workspaceId/thread/$threadId',
        params: { workspaceId, threadId: guid },
        replace: true,
      });
    } else {
      if (!threadId) return;
      sendMessage.mutate({
        workspaceId,
        threadId,
        contentList,
        files,
        variables: vars,
      });
    }
    setNewMessage('');
  };
  /** Unified "Send" */
  const sendNow = (files?: { id: string; name: string }[]) => {
    if (sendDisabled) return;
    internalSend(files);
  };

  const handleSendMessage = (files?: { id: string; name: string }[]) =>
    sendNow(files);

  const handleKeyDown = (
    e: React.KeyboardEvent,
    files?: { id: string; name: string }[]
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendDisabled) sendNow(files);
    }
  };

  return {
    // text + handlers
    newMessage,
    setNewMessage,
    handleKeyDown,
    handleSendMessage,
    isSending: sendMessage.isPending || !!thread?.isFlowRunning,
    supportsFiles: !!workspace?.supportsFiles,
    disabled: thread?.isFlowRunning,
    isNewThreadRoute,
    variables,
    setVariables,

    // Thread/workspace context
    workspace,
    workspaceId,
    threadId,

    // UI/UX state
    isMobile,
    leftOpen,
    rightOpen,
    isDragging,
    isFullscreen,
    setIsFullscreen,
    showExpand,

    // Files no longer managed in VM

    // derived
    sendDisabled,
  };
}
