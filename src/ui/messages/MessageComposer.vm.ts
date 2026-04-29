import { useMemo, useState } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { useSendMessage } from '@/domains/messages/mutations';
import { useThreadIsRunning } from '@/domains/threads/queries';
import { useWorkspace } from '@/domains/workspaces/queries';

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
  const isRunning = useThreadIsRunning(workspaceId, threadId);

  const isUploadingFiles = props.isUploadingFiles ?? false;

  // Expand affordance handled by editor styling; keep default false

  // Send message
  const sendMessage = useSendMessage();

  /** Derived: can we send? */
  const sendDisabled = useMemo(() => {
    const nothingToSend = !newMessage.trim() && !props.hasAttachments;
    const flowBlocked = isRunning || sendMessage.isPending;
    return isUploadingFiles || flowBlocked || nothingToSend;
  }, [
    isUploadingFiles,
    isRunning,
    sendMessage.isPending,
    newMessage,
    props.hasAttachments,
  ]);

  const internalSend = (
    text: string,
    files?: { id: string; name: string }[]
  ) => {
    if (!workspaceId || !threadId) return;
    const trimmed = text.trim();
    const contentList = trimmed
      ? [{ text: trimmed, image: undefined }]
      : undefined;
    const vars =
      variables && Object.keys(variables).length > 0 ? variables : undefined;
    sendMessage.mutate({
      workspaceId,
      threadId,
      contentList,
      files,
      variables: vars,
    });
    setNewMessage('');
  };

  /**
   * Can we send given the provided text/files right now?
   * Kept separate from `sendDisabled` (which drives the UI button) so callers
   * can bypass the React-state-based check when they have a fresher text value —
   * e.g. when reading directly from the editor at Enter time, since the Milkdown
   * `markdownUpdated` listener is debounced by 200ms and React state can lag.
   */
  const canSend = (text: string, files?: { id: string; name: string }[]) => {
    const hasFiles = (files?.length ?? 0) > 0 || !!props.hasAttachments;
    const nothingToSend = !text.trim() && !hasFiles;
    const flowBlocked = isRunning || sendMessage.isPending;
    return !(isUploadingFiles || flowBlocked || nothingToSend);
  };

  /**
   * Returns true when the message was dispatched, false when blocked.
   * Callers use the return value to decide whether to clear local UI state.
   */
  const handleSendMessage = (
    text: string,
    files?: { id: string; name: string }[]
  ): boolean => {
    if (!canSend(text, files)) return false;
    internalSend(text, files);
    return true;
  };

  const handleKeyDown = (
    _e: React.KeyboardEvent,
    _files?: { id: string; name: string }[]
  ) => {
    // Enter handling lives in the composer so it can read the editor's current
    // markdown directly — Milkdown's `markdownUpdated` listener is debounced
    // 200ms, so relying on React state here dropped characters on fast typing.
  };

  return {
    // text + handlers
    newMessage,
    setNewMessage,
    handleKeyDown,
    handleSendMessage,
    isSending: isRunning,
    supportsFiles: !!workspace?.supportsFiles,
    disabled: isRunning,
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
