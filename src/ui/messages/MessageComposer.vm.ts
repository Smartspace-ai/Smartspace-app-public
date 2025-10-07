'use client';

import type React from 'react';
import { useMemo, useState } from 'react';

import { useSendMessage } from '@/domains/messages/mutations';
import { useThread } from '@/domains/threads/queries';
import { useWorkspace } from '@/domains/workspaces/queries';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useSidebar } from '@/shared/ui/mui-compat/sidebar';




/** Public shape exported to the UI component */
export type MessageComposerVm = ReturnType<typeof useMessageComposerVm>;

export type MessageComposerVmProps = void; // no inbound props; VM owns its state

export function useMessageComposerVm() {
  const { workspaceId, threadId } = useRouteIds();
  const [isDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExpand] = useState(false);

  // Message + attachments state (owned by VM)
  const [newMessage, setNewMessage] = useState('');

  // Data/UX context
  const isMobile = useIsMobile();
  const { leftOpen, rightOpen } = useSidebar();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: thread } = useThread({ workspaceId, threadId });

  const isUploadingFiles = false;

  // Expand affordance handled by editor styling; keep default false

  /** Derived: can we send? */
  const sendDisabled = useMemo(() => {
    const nothingTyped = !newMessage.trim();
    const flowBlocked = !!thread?.isFlowRunning;
    return isUploadingFiles || flowBlocked || nothingTyped;
  }, [ isUploadingFiles, thread?.isFlowRunning, newMessage]);

  // Send message
  const sendMessage = useSendMessage();

  const internalSend = () => {
    if (!workspaceId || !threadId) return;
    const contentList = newMessage.trim()
      ? [{ text: newMessage.trim(), image: undefined }]
      : undefined;
    sendMessage.mutate({ workspaceId, threadId, contentList, files: undefined});
    setNewMessage('');
  };
  /** Unified "Send" */
  const sendNow = () => {
    if (sendDisabled) return;
    internalSend();
  };

  const handleSendMessage = () => sendNow();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendDisabled) sendNow();
    }
  };

  return {
    // text + handlers
    newMessage,
    setNewMessage,
    handleKeyDown,
    handleSendMessage,
    isSending: sendMessage.isPending || !!thread?.isFlowRunning,
    supportsFiles: workspace?.supportsFiles,
    disabled:thread?.isFlowRunning,

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
