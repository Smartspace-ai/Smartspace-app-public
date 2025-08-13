'use client';

import { Button } from '@/components/ui/button';
import { useFileMutations } from '@/hooks/data/use-file';
import { Workspace } from '@/models/workspace';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Paperclip, X, FileText, FileImage, FileVideo, FileAudio, FileArchive, FileCode, FileSpreadsheet, Presentation } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { FileInfo } from '../../../models/file';
import { ChatVariablesForm, ChatVariablesFormRef } from '../chat-variables-form/chat-variables-form';
import { useWorkspaceThread } from '@/hooks/data/use-thread';

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
  handleSendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
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
  variablesFormRef?: React.RefObject<ChatVariablesFormRef>;
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
  variablesFormRef,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreviewUrls, setFilePreviewUrls] = useState<
    { url: string; isImage: boolean; name: string }[]
  >([]);
  const { uploadFilesMutation } = useFileMutations();

  const prevUrlsRef = useRef<string[]>([]);
  const {data: thread} = useWorkspaceThread({workspaceId: workspace?.id, threadId: threadId})

  // Auto-adjust textarea height when message changes (including when cleared)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
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
      const filesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
      onFilesSelected?.(filesArray);
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
      const filesArray = Array.from(e.dataTransfer.files);
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
      e.preventDefault();
      e.stopPropagation();
      
      uploadFilesMutation.mutate(imageFiles, {
        onSuccess: (data) => {
          setImagesForMessage([...imagesForMessage, ...data]);
          setSelectedFiles([...selectedFiles, ...imageFiles]);
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

  const sendDisabled = (!newMessage.trim() && !uploadedFiles?.length && !imagesForMessage.length) || isUploadingFiles || disabled || thread?.isFlowRunning;

  return (
    <div className="ss-chat__composerh max-h-[60%] flex-shrink-0 overflow-y-auto w-full mt-auto bg-sidebar border-t px-4 py-4">

      {workspace && threadId && (
        <ChatVariablesForm workspace={workspace} threadId={threadId} ref={variablesFormRef} />
      )}
      
      {Object.keys(workspace?.variables ?? {}).length > 0 && <hr className="mb-2 mt-1" />}
      <div className="max-w-5xl mx-auto rounded-md border shadow-sm bg-background ">
        <div className="w-full mx-auto max-h-[400px] overflow-y-auto">
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
                            <div className={`flex items-center gap-2 p-2 rounded-md border bg-muted/20 hover:bg-muted/30 transition-colors ${isImage ? 'flex-col h-full' : ''}`}>
                              <div className="flex-shrink-0">
                                {isImage ? (
                                  <img
                                    src={file.url || '/placeholder.svg'}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-20 object-cover rounded"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-muted/40 flex items-center justify-center">
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
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);

                // Auto-resize logic
                e.target.style.height = "auto"; // Reset to auto so shrinking works too
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onInput={(e) => {
                // Ensures expansion even if value is set programmatically
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isDragging
                  ? "Drop files here..."
                  : disabled
                  ? "Select a thread to start chatting..."
                  : "Type a message..."
              }
              className="w-full resize-none border-0 bg-transparent px-5 py-4 text-sm focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[100px]"
              disabled={disabled}
            />
          </div>
        </div>
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
              handleSendMessage();
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
      </div>
    </div>
  );
}
