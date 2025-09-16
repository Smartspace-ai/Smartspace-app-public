'use client';

import { useFileMutations } from '@/domains/files/mutations';
import { FileInfo } from '@/domains/files/schemas';
import { useSendMessage } from '@/domains/messages/mutations';
import { useThread } from '@/domains/threads/queries';
import { useWorkspace } from '@/domains/workspaces/queries';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';
import { useSidebar } from '@/shared/ui/shadcn/sidebar';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatVariablesFormRef } from './json_forms/chat-variables-form';

/** Public shape exported to the UI component */
export type MessageComposerVm = ReturnType<typeof useMessageComposerVm>;

export type MessageComposerVmProps = void; // no inbound props; VM owns its state

export function useMessageComposerVm() {
  const { workspaceId, threadId } = useRouteIds();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExpand, setShowExpand] = useState(false);

  // Message + attachments state (owned by VM)
  const [newMessage, setNewMessage] = useState('');
  const [imagesForMessage, setImagesForMessage] = useState<FileInfo[]>([]);
  const variablesFormRef = useRef<ChatVariablesFormRef>(null);

  // Local selection of raw File objects (client-only)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<
    { url: string; isImage: boolean; name: string }[]
  >([]);
  const prevUrlsRef = useRef<string[]>([]);

  // Data/UX context
  const isMobile = useIsMobile();
  const { leftOpen, rightOpen } = useSidebar();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: thread } = useThread({ workspaceId, threadId });

  // Uploads (centralized via useFileMutations)
  const { uploadFilesMutation } = useFileMutations({ workspaceId, threadId });
  const isUploadingFiles = uploadFilesMutation.isPending;

  /** Textarea autoresize + "expand" affordance */
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    const MAX_TEXTAREA_HEIGHT = 240; // px
    textarea.style.height = 'auto';
    const desired = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${desired}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';

    const computed = window.getComputedStyle(textarea);
    let lineHeight = parseFloat(computed.lineHeight || '');
    if (!lineHeight || Number.isNaN(lineHeight)) {
      const fontSize = parseFloat(computed.fontSize || '16');
      lineHeight = fontSize * 1.4;
    }
    if (lineHeight > 0) {
      const visibleLines = Math.round(desired / lineHeight);
      setShowExpand(visibleLines >= 4);
    }
  };

  /** Keep autoresize in sync with message changes */
  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [newMessage]);

  /** Maintain / revoke object URLs for previews */
  useEffect(() => {
    // revoke prior
    prevUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));

    const newUrls = selectedFiles.map((file) => {
      const isImage = file.type.startsWith('image/');
      const url = isImage ? URL.createObjectURL(file) : '';
      return { url, isImage, name: file.name };
    });

    prevUrlsRef.current = newUrls.map((f) => f.url).filter(Boolean);
    setFilePreviewUrls(newUrls);
  }, [selectedFiles]);

  /** Derived: can we send? */
  const sendDisabled = useMemo(() => {
    const nothingTyped = !newMessage.trim();
    const nothingSelected = selectedFiles.length === 0 && imagesForMessage.length === 0;
    const flowBlocked = !!thread?.isFlowRunning;
    return isUploadingFiles || flowBlocked || (nothingTyped && nothingSelected);
  }, [ isUploadingFiles, thread?.isFlowRunning, newMessage, selectedFiles.length, imagesForMessage.length]);

  // Send message
  const sendMessage = useSendMessage();

  const internalSend = () => {
    if (!workspaceId || !threadId) return;
    const contentList = newMessage.trim()
      ? [{ text: newMessage.trim(), image: undefined }]
      : undefined;
    const variables = variablesFormRef.current?.getCurrentVariables();
    sendMessage.mutate({ workspaceId, threadId, contentList, files: imagesForMessage, variables });
    setNewMessage('');
    setImagesForMessage([]);
  };

  /** File actions */
  const handlePaperclipClick = () => fileInputRef.current?.click();

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const filesArray = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...filesArray]);
    uploadFilesMutation.mutate(filesArray, {
      onSuccess: (serverFiles) => {
        setImagesForMessage((prev) => [...prev, ...serverFiles]);
      },
    });
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    if (!e.dataTransfer.files?.length) return;
    const filesArray = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...filesArray]);
    uploadFilesMutation.mutate(filesArray, {
      onSuccess: (serverFiles) => {
        setImagesForMessage((prev) => [...prev, ...serverFiles]);
      },
    });
  };

  /** Paste only images; immediately upload those to get FileInfo */
  const onPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.type.startsWith('image/')) imageFiles.push(file);
      }
    }
    if (imageFiles.length === 0) return;

    e.preventDefault();
    e.stopPropagation();
    uploadFilesMutation.mutate(imageFiles, {
      onSuccess: (serverFiles) => {
        setImagesForMessage([...imagesForMessage, ...serverFiles]);
        setSelectedFiles((prev) => [...prev, ...imageFiles]);
      },
    });
  };

  const removeFileAt = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const removeAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** Unified "Send" that also clears file selection */
  const sendNow = () => {
    if (sendDisabled) return;
    internalSend();
    removeAllFiles();
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
    supportsFiles:workspace?.supportsFiles,
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

    // Textarea/Dropzone refs + helpers
    textareaRef,
    dropzoneRef,
    fileInputRef,
    adjustTextareaHeight,

    // Files state
    selectedFiles,
    filePreviewUrls,
    isUploadingFiles,
    onFileInputChange,
    handlePaperclipClick,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onPaste,
    removeFileAt,
    removeAllFiles,

    // images already uploaded (server FileInfo objects)
    imagesForMessage,
    setImagesForMessage,

    // derived
    sendDisabled,

    // variables form
    variablesFormRef,
  };
}
