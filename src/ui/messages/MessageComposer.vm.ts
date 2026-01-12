import { useMemo, useState } from 'react';

import { useSendMessage } from '@/domains/messages/mutations';
import { useThread } from '@/domains/threads/queries';
import { useWorkspace } from '@/domains/workspaces/queries';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useSidebar } from '@/shared/ui/mui-compat/sidebar';
import { isDraftThreadId } from '@/shared/utils/threadId';




/** Public shape exported to the UI component */
export type MessageComposerVm = ReturnType<typeof useMessageComposerVm>;

export type MessageComposerVmProps = {
  hasAttachments?: boolean;
  isUploadingFiles?: boolean;
}; // optional inbound props for attachments-owned-by-UI

export function useMessageComposerVm(props: MessageComposerVmProps = {}) {
  const { workspaceId, threadId } = useRouteIds();
  const [isDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExpand] = useState(false);
  const isDraftThread = isDraftThreadId(threadId);

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
  }, [isUploadingFiles, thread?.isFlowRunning, newMessage, props.hasAttachments]);

  // Send message
  const sendMessage = useSendMessage();

  const internalSend = (files?: { id: string; name: string }[]) => {
    if (!workspaceId || !threadId) return;
    const contentList = newMessage.trim()
      ? [{ text: newMessage.trim(), image: undefined }]
      : undefined;
    const vars = variables && Object.keys(variables).length > 0 ? variables : undefined;
    sendMessage.mutate({ workspaceId, threadId, contentList, files, variables: vars });
    setNewMessage('');
  };
  /** Unified "Send" */
  const sendNow = (files?: { id: string; name: string }[]) => {
    if (sendDisabled) return;
    internalSend(files);
  };

  const handleSendMessage = (files?: { id: string; name: string }[]) => sendNow(files);

  const handleKeyDown = (e: React.KeyboardEvent, files?: { id: string; name: string }[]) => {
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
    isDraftThread,
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
