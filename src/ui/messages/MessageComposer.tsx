'use client';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { ArrowBigUp, Maximize2, Minimize2, Paperclip } from 'lucide-react';
import type * as React from 'react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { FileInfo } from '@/domains/files/model';
import { useFileMutations } from '@/domains/files/mutations';

import { ChatVariablesForm } from '@/ui/chat-variables/VariablesForm';

import type { MarkdownEditorHandle } from '@/components/markdown/MarkdownEditor';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';

import { useMessageComposerVm } from './MessageComposer.vm';

declare global {
  interface Window {
    __ssDownloadFile?: (id: string) => Promise<string>;
  }
}

export default function MessageComposer() {
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileInfo[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);

  const vm = useMessageComposerVm({
    hasAttachments: attachedFiles.length > 0,
    isUploadingFiles: isUploadingAttachments,
  });
 
  const {
    // context
    workspace, workspaceId, threadId, isMobile, leftOpen, rightOpen,

    // text
    newMessage, setNewMessage, handleKeyDown, handleSendMessage, isSending, disabled,

    // ui state
    isFullscreen, setIsFullscreen, showExpand,

    // derived
    sendDisabled,

    // helpers
    supportsFiles,
  } = vm;

  const { uploadFilesMutation } = useFileMutations({ workspaceId, threadId });
  // Provide a global downloader for ssImage node views (non-React context)
  if (typeof window !== 'undefined') {
    window.__ssDownloadFile = async (id: string) => {
      const blob = await fetch(`/api/files/${id}/download?workspaceId=${workspaceId ?? ''}&threadId=${threadId ?? ''}`).then(r => r.blob());
      return URL.createObjectURL(blob);
    };
  }
  const onUploadFiles = async (files: File[]) => {
    const res = await uploadFilesMutation.mutateAsync(files);
    return res.map(({ id, name }) => ({ id, name }));
  };

  const handlePickFilesClick = () => {
    fileInputRef.current?.click();
  };

  const addAttachments = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingAttachments(true);
    try {
      const uploaded = await uploadFilesMutation.mutateAsync(files);
      setAttachedFiles((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const next = [...prev];
        for (const f of uploaded) {
          if (existing.has(f.id)) continue;
          existing.add(f.id);
          next.push({ id: f.id, name: f.name });
        }
        return next;
      });
    } finally {
      setIsUploadingAttachments(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    void addAttachments(files);
    // allow re-selecting same file
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAttachments = () => {
    setAttachedFiles([]);
  };

  const handleSendMessageAndClear = () => {
    handleSendMessage(attachedFiles);
    handleClearAttachments();
  };

  return (
    <div className="ss-chat__composer max-h-[60%] flex-shrink-0 w-full mt-auto bg-sidebar border-t px-4 py-4">
      {/* Hidden file input shared by all upload buttons */}
      {supportsFiles && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelected}
        />
      )}
      {workspace && threadId && (
        <div
          className={`${isMobile ? 'w-full max-w-full' : 'w-full'} ${
            !isMobile ? `${leftOpen || rightOpen ? 'max-w-[90%]' : 'max-w-[70%]'} mx-auto` : ''
          } transition-[max-width] duration-300 ease-in-out`}
        >
          <ChatVariablesForm workspace={workspace} threadId={threadId} setVariables={() => { console.log('setVariables') }}/>
        </div>
      )}
      {Object.keys(workspace?.variables ?? {}).length > 0 && <hr className="my-2" />}

      <div
        className={`${isMobile ? 'w-full max-w-full' : 'w-full'} ${
          !isMobile ? `${leftOpen || rightOpen ? 'max-w-[90%]' : 'max-w-[70%]'} mx-auto` : ''
        } bg-background ${isMobile ? '' : 'rounded-md border shadow-sm'} transition-[max-width] duration-300 ease-in-out`}
      >
        {attachedFiles.length > 0 && (
          <div className="border-b bg-muted/5 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-medium text-foreground/80">
                Attachments ({attachedFiles.length})
              </div>
              <Button
                type="button"
                size="small"
                variant="text"
                onClick={handleClearAttachments}
                className="text-xs normal-case min-w-0 px-2 h-7 text-muted-foreground"
              >
                Clear
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {attachedFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs"
                >
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[220px] truncate">{f.name}</span>
                  <button
                    type="button"
                    className="ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleRemoveAttachment(f.id)}
                    aria-label={`Remove ${f.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full max-h-[400px] overflow-y-auto">
          <div>
            {isMobile ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="relative flex-1 px-2 py-2">
                  <MarkdownEditor
                    ref={editorRef}
                    value={newMessage}
                    onChange={(md) => setNewMessage(md)}
                    onKeyDown={(e) => handleKeyDown(e, attachedFiles)}
                    onFilesAdded={(files) => { void addAttachments(files); }}
                    onUploadFiles={onUploadFiles}
                    fileHandlingMode="attachments"
                    workspaceId={workspaceId}
                    disabled={disabled}
                    placeholder="Type a message..."
                    className="md-editor--bare text-sm"
                  />
                  {showExpand && !isFullscreen && (
                    <IconButton
                      type="button"
                      size="small"
                      className="h-7 w-7 absolute top-1 right-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setIsFullscreen(true)}
                      aria-label="Expand"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </IconButton>
                  )}
                </div>

                {supportsFiles && (
                  <IconButton
                    type="button"
                    size="small"
                    className="h-10 w-10 rounded-full self-end"
                    onClick={handlePickFilesClick}
                    disabled={disabled}
                    aria-label="Upload files"
                  >
                    <Paperclip className="h-5 w-5" strokeWidth={2.5} />
                  </IconButton>
                )}

                <IconButton
                  onClick={handleSendMessageAndClear}
                  className={`h-10 w-10 rounded-full self-end ${sendDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={sendDisabled}
                  aria-label="Send"
                >
                  <ArrowBigUp className="h-5 w-5" strokeWidth={2.5} />
                </IconButton>
              </div>
            ) : (
              <div className="relative px-5 py-2">
                <MarkdownEditor
                  ref={editorRef}
                  value={newMessage}
                  onChange={(md) => setNewMessage(md)}
                  onKeyDown={(e) => handleKeyDown(e, attachedFiles)}
                  onFilesAdded={(files) => { void addAttachments(files); }}
                  onUploadFiles={onUploadFiles}
                  fileHandlingMode="attachments"
                  workspaceId={workspaceId}
                  disabled={disabled}
                  placeholder="Type a message..."
                  className="md-editor--bare text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile fullscreen composer */}
        {isMobile &&
          isFullscreen &&
          typeof document !== 'undefined' &&
          createPortal(
            <div className="fixed inset-x-0" style={{ top: '5vh', height: '95vh', left: 0, right: 0, zIndex: 1300 }}>
              <div className="relative h-full w-full bg-background border shadow-lg">
                <IconButton
                  type="button"
                  size="small"
                  className="h-8 w-8 absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsFullscreen(false);
                  }}
                  aria-label="Collapse"
                >
                  <Minimize2 className="h-4 w-4" />
                </IconButton>
                <div className="flex flex-col h-full">
                  <div className="flex-1 p-4">
                    <MarkdownEditor
                      ref={editorRef}
                      value={newMessage}
                      onChange={(md) => setNewMessage(md)}
                      onKeyDown={(e) => handleKeyDown(e, attachedFiles)}
                      onFilesAdded={(files) => { void addAttachments(files); }}
                      onUploadFiles={onUploadFiles}
                      fileHandlingMode="attachments"
                      workspaceId={workspaceId}
                      disabled={disabled}
                      className="md-editor--bare text-sm h-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 border-t bg-background">
                    <div className="flex-1" />
                    {supportsFiles && (
                      <IconButton
                        type="button"
                        onClick={handlePickFilesClick}
                        disabled={disabled}
                        aria-label="Upload files"
                      >
                        <Paperclip className="h-5 w-5" strokeWidth={2.5} />
                      </IconButton>
                    )}
                    <IconButton
                      onClick={handleSendMessageAndClear}
                      className={`h-10 w-10 rounded-full ${sendDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={sendDisabled}
                      aria-label="Send"
                    >
                      <ArrowBigUp className="h-5 w-5" strokeWidth={2.5} />
                    </IconButton>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Desktop footer actions */}
        {!isMobile && (
          <div className="flex items-center justify-between px-4 py-2 bg-background">
            <div className="flex items-center gap-3">
              {supportsFiles && (
                <Button
                  type="button"
                  size="small"
                  onClick={handlePickFilesClick}
                  disabled={disabled}
                  startIcon={<Paperclip className="h-4 w-4" />}
                  className="text-xs text-muted-foreground hover:text-foreground normal-case px-2 py-1 h-7 min-w-0"
                >
                  Upload files
                </Button>
              )}
            </div>

            <Button
              onClick={handleSendMessageAndClear}
              className={`text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 h-7 ${
                sendDisabled ? 'opacity-50 cursor-not-allowed' : ''
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
