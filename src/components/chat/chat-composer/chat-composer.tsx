'use client';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useFileMutations } from '@/hooks/use-files';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWorkspaceThread } from '@/hooks/use-workspace-thread';
import { Workspace } from '@/models/workspace';
import { ChatVariablesForm } from "@/ui/chat-variables";
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowBigUp, Check, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo, Maximize2, Minimize2, Paperclip, Presentation, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileInfo } from '../../../models/file';
import { toast } from 'sonner';

// Utility function to get file type icon
const getFileIcon = (fileName: string, fileType: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Image files
  if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '')) {
    return FileImage;
  }
  
  // Video files
  if (fileType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '')) {
    return FileVideo;
  }
  
  // Audio files
  if (fileType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extension || '')) {
    return FileAudio;
  }
  
  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension || '')) {
    return FileArchive;
  }
  
  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'html', 'css', 'json', 'xml', 'md'].includes(extension || '')) {
    return FileCode;
  }
  
  // Spreadsheet files
  if (['xlsx', 'xls', 'csv'].includes(extension || '')) {
    return FileSpreadsheet;
  }
  
  // Presentation files
  if (['pptx', 'ppt'].includes(extension || '')) {
    return Presentation;
  }
  
  // Default document icon
  return FileText;
};

type ChatComposerProps = {
  workspace?: Workspace;
  threadId?: string;
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (variables: Record<string, any> | null) => void;
  handleKeyDown: (e: React.KeyboardEvent, variables: Record<string, any> | null) => void;
  isSending: boolean;
  supportsFiles: boolean;
  disabled: boolean;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  uploadedFiles?: any[]; // Optional for backward compatibility
  setUploadedFiles?: (files: any[]) => void;
  isUploadingFiles?: boolean;
  onFilesSelected?: (files: File[]) => void;
  setImagesForMessage: (files: FileInfo[]) => void;
  imagesForMessage: FileInfo[];
};

export default function ChatComposer({
  workspace,
  threadId,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleKeyDown,
  isSending,
  disabled,
  selectedFiles,
  setSelectedFiles,
  uploadedFiles,
  setUploadedFiles,
  isUploadingFiles,
  onFilesSelected,
  supportsFiles,
  setImagesForMessage,
  imagesForMessage,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExpand, setShowExpand] = useState(false);
  const [filePreviewUrls, setFilePreviewUrls] = useState<
    { url: string; isImage: boolean; name: string }[]
  >([]);
  const { uploadFilesMutation } = useFileMutations();
  const [variables, setVariables] = useState<Record<string, any>|null>(null);
  const MAX_FILES = 15;

  const prevUrlsRef = useRef<string[]>([]);
  const {data: thread} = useWorkspaceThread({workspaceId: workspace?.id, threadId: threadId})
  const isMobile = useIsMobile();
  const { leftOpen, rightOpen } = useSidebar();

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    const MAX_TEXTAREA_HEIGHT = 240; // px
    textarea.style.height = 'auto';
    const desired = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${desired}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';

    // Determine when to show expand button (>= 4 visible lines)
    const computed = window.getComputedStyle(textarea);
    let lineHeight = parseFloat(computed.lineHeight || '');
    if (!lineHeight || Number.isNaN(lineHeight)) {
      const fontSize = parseFloat(computed.fontSize || '16');
      lineHeight = fontSize * 1.4; // fallback approximation
    }
    if (lineHeight > 0) {
      const visibleLines = Math.round(desired / lineHeight);
      setShowExpand(visibleLines >= 4);
    }
  };

  // Auto-adjust textarea height when message changes (including when cleared)
  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [newMessage]);

  useEffect(() => {
    // Cleanup previous object URLs
    prevUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));

    const newPreviewUrls = [...selectedFiles].map((file) => {
      const isImage = file.type.startsWith('image/');
      const url = isImage ? URL.createObjectURL(file) : '';
      return { url, isImage, name: file.name };
    });

    // Save new URLs for future cleanup
    prevUrlsRef.current = newPreviewUrls.map((f) => f.url);

    setFilePreviewUrls(newPreviewUrls);
  }, [selectedFiles, imagesForMessage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const remaining = MAX_FILES - selectedFiles.length;
      if (remaining <= 0) {
        toast.error(`Cannot upload more than ${MAX_FILES} files at a time`);
        // Clear input so user can re-select if needed
        e.target.value = '';
        return;
      }
      const attempted = Array.from(e.target.files);
      const filesArray = attempted.slice(0, remaining);
      if (filesArray.length < attempted.length) {
        toast.error(`Cannot upload more than ${MAX_FILES} files at a time`);
      }
      setSelectedFiles([...selectedFiles, ...filesArray]);
      onFilesSelected?.(filesArray);
      // Clear input to allow picking the same files again if desired
      e.target.value = '';
    }
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const remaining = MAX_FILES - selectedFiles.length;
      if (remaining <= 0) {
        toast.error(`Cannot upload more than ${MAX_FILES} files at a time`);
        return;
      }
      const attempted = Array.from(e.dataTransfer.files);
      const filesArray = attempted.slice(0, remaining);
      if (filesArray.length < attempted.length) {
        toast.error(`Cannot upload more than ${MAX_FILES} files at a time`);
      }
      setSelectedFiles([...selectedFiles, ...filesArray]);
      onFilesSelected?.(filesArray);
    }
  };

  // Updated handlePaste function to handle pasted images only
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    
    // Check if there are any image files in the clipboard
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }
    }
    
    // Only prevent default behavior if we have image files to handle
    if (imageFiles.length > 0) {
      const remaining = MAX_FILES - selectedFiles.length;
      if (remaining <= 0) {
        toast.error(`Cannot upload more than ${MAX_FILES} files at a time`);
        return;
      }
      const filesToUpload = imageFiles.slice(0, remaining);
      if (filesToUpload.length < imageFiles.length) {
        toast.error(`Cannot upload more than ${MAX_FILES} files at a time`);
      }
      e.preventDefault();
      e.stopPropagation();
      
      uploadFilesMutation.mutate(filesToUpload, {
        onSuccess: (data) => {
          setImagesForMessage([...imagesForMessage, ...data]);
          setSelectedFiles([...selectedFiles, ...filesToUpload]);
        },
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setUploadedFiles?.((uploadedFiles ?? []).filter((_, i) => i !== index));
  };

  const handleRemoveAllFiles = () => {
    setSelectedFiles([]);
    setUploadedFiles?.([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendDisabled = (!newMessage.trim() && !uploadedFiles?.length && !imagesForMessage.length) || isUploadingFiles 
  return (
    <div className="ss-chat__composer max-h-[60%] flex-shrink-0 w-full mt-auto bg-sidebar border-t px-4 py-4">

      {workspace && threadId && (
        <div className={`${isMobile ? 'w-full max-w-full' : 'w-full'} ${!isMobile ? `${leftOpen || rightOpen ? 'max-w-[90%]' : 'max-w-[70%]'} mx-auto` : ''} transition-[max-width] duration-300 ease-in-out`}>
          <ChatVariablesForm workspace={workspace} threadId={threadId} setVariables={setVariables}/>
        </div>
      )}
      {Object.keys(workspace?.variables ?? {}).length > 0 && <hr className="my-2" />}

      <div className={`${isMobile ? 'w-full max-w-full' : 'w-full'} ${!isMobile ? `${leftOpen || rightOpen ? 'max-w-[90%]' : 'max-w-[70%]'} mx-auto` : ''} bg-background ${isMobile ? '' : 'rounded-md border shadow-sm'} transition-[max-width] duration-300 ease-in-out`}>
        <div className="w-full">
          <div
            ref={dropzoneRef}
            className={`flex flex-col overflow-hidden transition-all ${
              isDragging
                ? 'border-primary border-dashed ring-2 ring-primary/20'
                : ''
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onPaste={handlePaste}
          >
            <AnimatePresence>
              {selectedFiles.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-muted/5 border-b overflow-hidden"
                >
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-medium text-foreground/80">
                        {selectedFiles.length}{' '}
                        {selectedFiles.length === 1 ? 'file' : 'files'} selected
                        {isUploadingFiles && ' (uploading...)'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        onClick={handleRemoveAllFiles}
                        disabled={isUploadingFiles}
                      >
                        Remove all
                      </Button>
                    </div>

                    <div className="max-h-60 overflow-y-auto pr-1">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 auto-rows-min">
                        {filePreviewUrls.map((file, index) => {
                          const FileIcon = getFileIcon(file.name, selectedFiles[index]?.type || '');
                          const isImage = file.isImage;
                          return (
                            <motion.div
                              key={index}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              className={`relative group ${isImage ? 'row-span-2' : ''}`}
                            >
                              <div className={`flex items-center gap-2 p-2 rounded-md border bg-muted/10 hover:bg-muted/20 transition-colors ${isImage ? 'flex-col h-full' : ''}`}>
                                <div className="flex-shrink-0">
                                  {isImage ? (
                                    <img
                                      src={file.url || '/placeholder.svg'}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-20 object-cover rounded"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-muted/30 flex items-center justify-center">
                                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className={`flex-1 min-w-0 ${isImage ? 'w-full text-center' : ''}`}>
                                  <div className="text-xs font-medium text-foreground truncate">
                                    {file.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                  </div>
                                </div>
                                {(uploadedFiles ?? [])[index] && (
                                  <div className="flex-shrink-0">
                                    <div className="bg-green-500 rounded-full p-0.5">
                                      <Check className="h-2 w-2 text-white" />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-5 w-5 rounded-full"
                                  onClick={() => handleRemoveFile(index)}
                                  disabled={isUploadingFiles}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isMobile ? (
              <div className="flex items-center gap-2 px-3 py-2">
                {supportsFiles && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground self-end"
                    disabled={disabled || isUploadingFiles}
                    onClick={handlePaperclipClick}
                  >
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      className="hidden"
                    />
                  </Button>
                )}

                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      adjustTextareaHeight(e.target);
                    }}
                    onInput={(e) => {
                      adjustTextareaHeight(e.currentTarget);
                    }}
                    onKeyDown={(e) => {
                      if (
                        isMobile &&
                        e.key === 'Enter' &&
                        !e.shiftKey &&
                        !e.ctrlKey &&
                        !e.altKey &&
                        !e.metaKey
                      ) {
                        e.preventDefault();
                        const target = e.currentTarget;
                        const start = target.selectionStart ?? target.value.length;
                        const end = target.selectionEnd ?? start;
                        const newValue =
                          target.value.slice(0, start) + '\n' + target.value.slice(end);
                        setNewMessage(newValue);
                        requestAnimationFrame(() => {
                          try {
                            target.selectionStart = target.selectionEnd = start + 1;
                          } catch {
                            /* ignore caret set errors */
                          }
                          adjustTextareaHeight(target);
                        });
                        return;
                      }
                      handleKeyDown(e, variables);
                    }}
                    placeholder={
                      isDragging
                        ? "Drop files here..."
                        : disabled
                        ? "Select a thread to start chatting..."
                        : "Type a message..."
                    }
                    className="w-full resize-none border-0 rounded-none bg-transparent px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors max-h-60 overflow-y-auto"
                    style={{ fontSize: 16, WebkitTextSizeAdjust: '100%' }}
                    disabled={disabled}
                  />
                  {showExpand && !isFullscreen && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 absolute top-1 right-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setIsFullscreen(true)}
                      aria-label="Expand"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Button
                  onClick={() => {
                    handleSendMessage(variables);
                    handleRemoveAllFiles();
                  }}
                  variant="default"
                  size="icon"
                  className={`h-10 w-10 rounded-full self-end ${
                    sendDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={sendDisabled}
                  aria-label="Send"
                >
                  <ArrowBigUp className="h-5 w-5" strokeWidth={2.5} />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    adjustTextareaHeight(e.target);
                  }}
                  onInput={(e) => {
                    adjustTextareaHeight(e.currentTarget);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, variables)}
                  placeholder={
                    isDragging
                      ? "Drop files here..."
                      : disabled
                      ? "Select a thread to start chatting..."
                      : "Type a message..."
                  }
                  className={`w-full resize-none border-0 rounded-none bg-transparent px-5 py-2 text-sm focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors max-h-60 overflow-y-auto`}
                  style={{ fontSize: 16, WebkitTextSizeAdjust: '100%' }}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>
        {isMobile && isFullscreen && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-x-0" style={{ top: '5vh', height: '95vh', left: 0, right: 0, zIndex: 1300 }}>
            <div className="relative h-full w-full bg-background border shadow-lg">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsFullscreen(false);
                }}
                aria-label="Collapse"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <textarea
                    rows={10}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        !e.shiftKey &&
                        !e.ctrlKey &&
                        !e.altKey &&
                        !e.metaKey
                      ) {
                        e.preventDefault();
                        const target = e.currentTarget;
                        const start = target.selectionStart ?? target.value.length;
                        const end = target.selectionEnd ?? start;
                        const newValue =
                          target.value.slice(0, start) + '\n' + target.value.slice(end);
                        setNewMessage(newValue);
                        requestAnimationFrame(() => {
                          try {
                            target.selectionStart = target.selectionEnd = start + 1;
                          } catch {
                            /* ignore caret set errors */
                          }
                        });
                        return;
                      }
                      handleKeyDown(e, variables);
                    }}
                    placeholder={disabled ? "Select a thread to start chatting..." : "Type a message..."}
                    className="w-full h-full resize-none border-0 bg-background p-4 text-sm focus-visible:outline-none focus-visible:ring-0"
                    style={{ fontSize: 16, WebkitTextSizeAdjust: '100%' }}
                    disabled={disabled}
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 border-t bg-background">
                  {supportsFiles && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      disabled={disabled || isUploadingFiles}
                      onClick={handlePaperclipClick}
                    >
                      <Paperclip className="h-4 w-4" />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        className="hidden"
                      />
                    </Button>
                  )}
                  <div className="flex-1" />
                  <Button
                    onClick={() => {
                      handleSendMessage(variables);
                      handleRemoveAllFiles();
                    }}
                    variant="default"
                    size="icon"
                    className={`h-10 w-10 rounded-full ${
                      sendDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={sendDisabled}
                    aria-label="Send"
                  >
                    <ArrowBigUp className="h-5 w-5" strokeWidth={2.5} />
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
        {!isMobile && (
        <div className="flex items-center justify-between px-4 py-2 bg-background">
          <div className="flex items-center gap-3">
            {supportsFiles && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                disabled={disabled || isUploadingFiles}
                onClick={handlePaperclipClick}
              >
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
              </Button>
            )}
          </div>

          <Button
            onClick={() => {
              handleSendMessage(variables);
              handleRemoveAllFiles();
              // Reset textarea height is now handled by useEffect when newMessage changes
            }}
            variant="default"
            size="sm"
            className={`text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 h-7 ${
              sendDisabled
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            disabled={sendDisabled}
          >
            {isSending ? (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-background animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-background animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-background animate-bounce" />
              </span>
            ) : (
              'Send'
            )}
          </Button>
        </div>
        )}
      </div>
    </div>
  );
}
