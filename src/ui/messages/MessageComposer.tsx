'use client';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import {
  ArrowBigUp,
  Check,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Maximize2,
  Minimize2,
  Paperclip,
  Presentation,
  X,
} from 'lucide-react';
import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';
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

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']);

function getExtension(fileName: string) {
  const parts = (fileName || '').split('.');
  return (parts.length > 1 ? parts[parts.length - 1] : '').toLowerCase();
}

function isLikelyImageFile(fileName: string) {
  return imageExtensions.has(getExtension(fileName));
}

function getFileIcon(fileName: string) {
  const ext = getExtension(fileName);

  if (imageExtensions.has(ext)) return FileImage;
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) return FileVideo;
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext)) return FileAudio;
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return FileArchive;
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'html', 'css', 'json', 'xml', 'md'].includes(ext)) return FileCode;
  if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['pptx', 'ppt'].includes(ext)) return Presentation;
  return FileText;
}

export default function MessageComposer() {
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Milkdown isn't fully controlled by `value`, so we force-remount the editor after sending to guarantee a visual clear.
  const [editorKey, setEditorKey] = useState(0);

  type AttachmentItem = {
    key: string;
    name: string;
    ext: string;
    isImage: boolean;
    /** Local object URL for image preview (revoked on removal/clear) */
    previewUrl?: string;
    status: 'uploading' | 'done' | 'error';
    fileId?: string;
  };

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const previewUrlsRef = useRef<Record<string, string>>({});
  const [uploadingCount, setUploadingCount] = useState(0);

  const uploadedAttachments: FileInfo[] = attachments
    .filter((a) => a.status === 'done' && a.fileId)
    .map((a) => ({ id: a.fileId as string, name: a.name }));

  const isUploadingAttachments = uploadingCount > 0;

  const vm = useMessageComposerVm({
    hasAttachments: uploadedAttachments.length > 0,
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
    isDraftThread,
  } = vm;

  // Draft threads use a placeholder thread id; omit it for uploads so files still work in draft mode.
  const { uploadFilesMutation, getFileBlobUrl } = useFileMutations({
    workspaceId,
    threadId: isDraftThread ? undefined : threadId,
  });
  // Provide a global downloader for ssImage node views (non-React context)
  if (typeof window !== 'undefined') {
    window.__ssDownloadFile = async (id: string) => {
      return await getFileBlobUrl(id);
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

    const items: AttachmentItem[] = files.map((f) => {
      const key = `${f.name}:${f.size}:${f.type}:${f.lastModified}`;
      const isImage = f.type.startsWith('image/');
      const ext = getExtension(f.name);
      const previewUrl = isImage ? URL.createObjectURL(f) : undefined;
      if (previewUrl) previewUrlsRef.current[key] = previewUrl;
      return {
        key,
        name: f.name || 'file',
        ext,
        isImage,
        previewUrl,
        status: 'uploading',
      };
    });

    // optimistic add (dedupe by key)
    setAttachments((prev) => {
      const existing = new Set(prev.map((p) => p.key));
      const next = [...prev];
      for (const it of items) {
        if (existing.has(it.key)) continue;
        existing.add(it.key);
        next.push(it);
      }
      return next;
    });

    setUploadingCount((c) => c + 1);
    try {
      const uploaded = await uploadFilesMutation.mutateAsync(files);
      setAttachments((prev) => {
        const next = prev.slice();
        // assume upload result order matches input order
        for (let i = 0; i < items.length; i++) {
          const localKey = items[i]?.key;
          const info = uploaded[i];
          if (!localKey || !info) continue;
          const idx = next.findIndex((x) => x.key === localKey);
          if (idx === -1) continue; // user removed it while uploading
          next[idx] = {
            ...next[idx],
            status: 'done',
            fileId: info.id,
            name: info.name || next[idx].name,
            ext: getExtension(info.name || next[idx].name),
          };
        }
        return next;
      });
    } catch {
      setAttachments((prev) => prev.map((a) => (items.some((it) => it.key === a.key) ? { ...a, status: 'error' } : a)));
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
  };

  // cleanup any local object URLs when attachments change/remove
  useEffect(() => {
    const keys = new Set(attachments.map((a) => a.key));
    for (const [k, url] of Object.entries(previewUrlsRef.current)) {
      if (keys.has(k)) continue;
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      delete previewUrlsRef.current[k];
    }
  }, [attachments]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    void addAttachments(files);
    // allow re-selecting same file
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.key !== id));
    const url = previewUrlsRef.current[id];
    if (url) {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      delete previewUrlsRef.current[id];
    }
  };

  const handleClearAttachments = () => {
    setAttachments([]);
    for (const url of Object.values(previewUrlsRef.current)) {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    }
    previewUrlsRef.current = {};
  };

  const handleSendMessageAndClear = () => {
    if (sendDisabled) return;
    handleSendMessage(uploadedAttachments);
    handleClearAttachments();
    setEditorKey((k) => k + 1);
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (no Shift) and then clear both attachments + editor UI state.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (sendDisabled) return;
      handleSendMessageAndClear();
      return;
    }
    // Preserve any other key handling from the VM (currently a no-op outside Enter).
    handleKeyDown(e, uploadedAttachments);
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
        {attachments.length > 0 && (
          <div className="border-b bg-muted/5 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-medium text-foreground/80">
                {attachments.length} {attachments.length === 1 ? 'file' : 'files'} selected
                {isUploadingAttachments ? ' (uploading...)' : ''}
              </div>
              <Button
                type="button"
                size="small"
                variant="text"
                onClick={handleClearAttachments}
                disabled={isUploadingAttachments}
                className="text-xs normal-case min-w-0 px-2 h-7 text-muted-foreground hover:text-destructive"
              >
                Remove all
              </Button>
            </div>

            <div className="mt-2 overflow-x-auto">
              <div className="flex gap-2 pb-1">
                {attachments.map((f) => {
                  const isImage = f.isImage || isLikelyImageFile(f.name);
                  const previewUrl = f.previewUrl;
                  const Icon = getFileIcon(f.name);
                  const ext = getExtension(f.name).toUpperCase() || 'FILE';
                  const isDone = f.status === 'done';
                  const isUploading = f.status === 'uploading';

                  return (
                    <div
                      key={f.key}
                      className="relative group w-[180px] min-w-[180px] rounded-md border bg-background overflow-hidden"
                      title={f.name}
                    >
                      <div className="h-[58px] w-full bg-muted/10 flex items-center justify-center overflow-hidden">
                        {isImage ? (
                          previewUrl ? (
                            <img src={previewUrl} alt={f.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <span className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 border-t-foreground/60 animate-spin" />
                          )
                        ) : (
                          <div className="w-9 h-9 rounded bg-muted/20 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="px-2 py-1.5">
                        <div className="text-xs font-medium text-foreground truncate" title={f.name}>
                          {f.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{ext}</div>
                      </div>

                      {/* Status: uploaded check / uploading spinner */}
                      {isDone && (
                        <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-foreground/60 animate-spin" />
                      )}

                      {/* Remove single file */}
                      <button
                        type="button"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 border opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        onClick={() => handleRemoveAttachment(f.key)}
                        aria-label={`Remove ${f.name}`}
                        disabled={isUploadingAttachments}
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-h-[400px] overflow-y-auto">
          <div>
            {isMobile ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="relative flex-1 px-2 py-2">
                  <MarkdownEditor
                    key={`composer-md-${editorKey}`}
                    ref={editorRef}
                    value={newMessage}
                    onChange={(md) => setNewMessage(md)}
                    onKeyDown={handleComposerKeyDown}
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
                    <Paperclip className="h-5 w-5 text-muted-foreground/70" strokeWidth={2} />
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
                  key={`composer-md-${editorKey}`}
                  ref={editorRef}
                  value={newMessage}
                  onChange={(md) => setNewMessage(md)}
                  onKeyDown={handleComposerKeyDown}
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
                      key={`composer-md-${editorKey}`}
                      ref={editorRef}
                      value={newMessage}
                      onChange={(md) => setNewMessage(md)}
                      onKeyDown={handleComposerKeyDown}
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
                        <Paperclip className="h-5 w-5 text-muted-foreground/70" strokeWidth={2} />
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
                <IconButton
                  type="button"
                  onClick={handlePickFilesClick}
                  disabled={disabled}
                  aria-label="Upload files"
                  className="text-muted-foreground/70 hover:text-muted-foreground"
                >
                  <Paperclip className="h-5 w-5" strokeWidth={2} />
                </IconButton>
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
