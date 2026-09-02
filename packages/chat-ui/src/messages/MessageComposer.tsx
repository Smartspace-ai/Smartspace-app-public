import MuiButton from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import {
  Check,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Mic,
  Minimize2,
  Paperclip,
  Presentation,
  Send,
  Square,
  X,
} from 'lucide-react';
import type * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useChatService } from '@/platform/chat';

import type { FileInfo } from '@/domains/files/model';
import { useFileMutations } from '@/domains/files/mutations';
import { useCancelFlowRun } from '@/domains/flowruns/mutations';
import { useMessages } from '@/domains/messages';
import { useSpeechConfig } from '@/domains/speech/queries';

import type { MarkdownEditorHandle } from '@/shared/markdown/MarkdownEditor';
import { MarkdownEditor } from '@/shared/markdown/MarkdownEditor';
import { useDictation } from '@/shared/speech/useDictation';

import { ChatVariablesForm } from '@/chat-variables/VariablesForm';

import { DictationButton, dictationErrorMessages } from './DictationButton';
import { useMessageComposerVm } from './MessageComposer.vm';

declare global {
  interface Window {
    __ssDownloadFile?: (id: string) => Promise<string>;
  }
}

const imageExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
]);

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
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext))
    return FileVideo;
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext))
    return FileAudio;
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext))
    return FileArchive;
  if (
    [
      'js',
      'ts',
      'jsx',
      'tsx',
      'py',
      'java',
      'cpp',
      'c',
      'cs',
      'php',
      'html',
      'css',
      'json',
      'xml',
      'md',
    ].includes(ext)
  )
    return FileCode;
  if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['pptx', 'ppt'].includes(ext)) return Presentation;
  return FileText;
}

export type MessageComposerProps = {
  /**
   * @deprecated No-op. The composer sits in the same centred reading column as
   * the messages (`.chat-column`) at every size. Still accepted so existing
   * callers keep compiling.
   */
  expandedLayout?: boolean;
};

export default function MessageComposer(_props: MessageComposerProps = {}) {
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
    workspace,
    workspaceId,
    threadId,
    isMobile,

    // text
    newMessage,
    setNewMessage,
    handleSendMessage,
    isSending,
    disabled,

    // ui state
    isFullscreen,
    setIsFullscreen,

    // derived
    sendDisabled,

    // helpers
    supportsFiles,
    isDraftThread,
    setVariables,
  } = vm;

  // An untouched thread gets the design's opening layout: the greeting, this card
  // and nothing else, as one narrower block centred in the canvas rather than a
  // composer pinned to the bottom. `MessageList` already reads this query, so
  // this is a cache hit, not a second request.
  const { data: threadMessages } = useMessages(threadId);
  const isEmptyThread = (threadMessages ?? []).length === 0;

  // Draft threads use a placeholder thread id; omit it for uploads so files still work in draft mode.
  const { uploadFilesMutation, getFileBlobUrl } = useFileMutations({
    workspaceId,
    threadId: isDraftThread ? undefined : threadId,
  });

  // While the flow is generating a response, Send's slot becomes a Stop
  // button (only when the service supports cancellation — otherwise the
  // legacy disabled/dots state stays). The thread id IS the flow-run id;
  // the engine stops within seconds and the thread SSE clears isSending.
  const chatService = useChatService();
  const {
    mutate: cancelMutate,
    isPending: cancelPending,
    isSuccess: cancelAccepted,
    isError: cancelErrored,
    reset: cancelReset,
  } = useCancelFlowRun();
  const canStop = isSending && !!chatService.cancelFlowRun;
  // Cancellation is cooperative, so there is a gap between the accepted
  // request and isSending actually flipping — hold a disabled "Stopping…"
  // state across it instead of allowing repeat clicks.
  const stopping = cancelPending || cancelAccepted;
  const handleStopRun = () => {
    if (stopping) return;
    cancelMutate(threadId);
  };
  // Re-arm for the next run: without the reset, a later message's Stop
  // button would be born stuck in the "Stopping…" state.
  useEffect(() => {
    if (!isSending && (cancelAccepted || cancelErrored)) {
      cancelReset();
    }
  }, [isSending, cancelAccepted, cancelErrored, cancelReset]);

  // Two MarkdownEditors (inline + the mobile-fullscreen portal) can be mounted at
  // once and share `editorRef`; the portal commits later, so it wins. React nulls
  // a ref on unmount, which on collapse would leave the surviving inline editor
  // detached — and dictation would then insert into nothing, silently. This
  // callback's identity deliberately changes with `isFullscreen` so React
  // re-invokes it on the editor that is still mounted.
  const attachEditor = useCallback(
    (handle: MarkdownEditorHandle | null) => {
      if (handle) editorRef.current = handle;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isFullscreen]
  );

  // Dictation: only when the service implements it AND the install has speech
  // configured; otherwise the design's mic stays as a disabled placeholder.
  // Final phrases become real text at the caret; provisional ones render as
  // greyed ghost text there and never enter the document, so a mid-phrase send
  // can't ship half-heard words.
  const { data: speechConfig } = useSpeechConfig();
  const getSpeechToken = useMemo(
    () => chatService.getSpeechToken?.bind(chatService),
    [chatService]
  );
  const dictation = useDictation({
    endpoint: speechConfig?.enabled ? speechConfig.endpoint : null,
    locale: speechConfig?.defaultLocale ?? 'en-US',
    getToken: getSpeechToken,
    // Final phrases become real text; provisional ones render as greyed ghost
    // text at the caret and never enter the document.
    onPhrase: (text) => editorRef.current?.insertText(`${text} `),
    onInterim: (text) => editorRef.current?.setDictationGhost(text),
  });
  const { stop: stopDictation } = dictation;
  const handleDictationToggle = () => {
    // Put the caret where the words will land before the first phrase arrives.
    if (dictation.state === 'idle') editorRef.current?.focus();
    dictation.toggle();
  };
  useEffect(() => {
    if (disabled) stopDictation();
  }, [disabled, stopDictation]);
  // Provide a global downloader for ssImage node views (non-React context).
  // Milkdown's image node view reads `window.__ssDownloadFile` by name on
  // first render, so an effect-based assignment runs early enough.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__ssDownloadFile = (id: string) => getFileBlobUrl(id);
    return () => {
      if (window.__ssDownloadFile) delete window.__ssDownloadFile;
    };
  }, [getFileBlobUrl]);
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
      setAttachments((prev) =>
        prev.map((a) =>
          items.some((it) => it.key === a.key) ? { ...a, status: 'error' } : a
        )
      );
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
  };

  // cleanup any local object URLs when attachments change/remove
  useEffect(() => {
    const keys = new Set(attachments.map((a) => a.key));
    for (const [k, url] of Object.entries(previewUrlsRef.current)) {
      if (keys.has(k)) continue;
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
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
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
      delete previewUrlsRef.current[id];
    }
  };

  const handleClearAttachments = () => {
    setAttachments([]);
    for (const url of Object.values(previewUrlsRef.current)) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    }
    previewUrlsRef.current = {};
  };

  // Re-focus the editor after it remounts (editorKey changes on send).
  useEffect(() => {
    if (editorKey === 0) return; // skip initial mount
    // Small delay to let the new Milkdown instance mount and populate the ref.
    const id = window.setTimeout(() => editorRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [editorKey]);

  const handleSendMessageAndClear = () => {
    // Read the freshest markdown straight from the editor. The `markdownUpdated`
    // listener is debounced by 200ms in `@milkdown/plugin-listener`, so when a
    // user types fast and hits Enter the React `newMessage` state can be stale —
    // previously that caused the send to use/require old text and the subsequent
    // editor remount to wipe characters the user had just typed.
    const latestText = editorRef.current?.getMarkdown() ?? newMessage;
    const sent = handleSendMessage(latestText, uploadedAttachments);
    // A refused send (empty, still uploading, flow running) must leave dictation
    // alone — stopping here would silently bin what the user just said.
    if (!sent) return;
    // Only once the message is away: the editor remounts below, and a phrase
    // arriving after that would land in the next message unannounced. A phrase
    // still in flight at this instant belongs to neither message and is dropped.
    stopDictation();
    handleClearAttachments();
    setEditorKey((k) => k + 1);
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageAndClear();
    }
  };

  return (
    <div
      className={`ss-chat__composer max-h-[60%] w-full shrink-0 px-4 pt-2 ${
        isEmptyThread
          ? // Opening layout: narrower than a conversation and floated up with
            // the greeting, which carries the matching `mt-auto`.
            'mx-auto mb-auto max-w-2xl'
          : 'chat-column mt-auto pb-4'
      }`}
    >
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

      <div className="chat-composer w-full overflow-hidden">
        {attachments.length > 0 && (
          <div className="border-b bg-muted/5 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-medium text-foreground/80">
                {attachments.length}{' '}
                {attachments.length === 1 ? 'file' : 'files'} selected
                {isUploadingAttachments ? ' (uploading...)' : ''}
              </div>
              <MuiButton
                type="button"
                size="small"
                variant="text"
                onClick={handleClearAttachments}
                disabled={isUploadingAttachments}
                className="text-xs normal-case min-w-0 px-2 h-7 text-muted-foreground hover:text-destructive"
              >
                Remove all
              </MuiButton>
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
                            <img
                              src={previewUrl}
                              alt={f.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
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
                        <div
                          className="text-xs font-medium text-foreground truncate"
                          title={f.name}
                        >
                          {f.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {ext}
                        </div>
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

        {/* Prompt field */}
        <div className="max-h-[400px] w-full overflow-y-auto">
          <MarkdownEditor
            key={`composer-md-${editorKey}`}
            ref={attachEditor}
            value={newMessage}
            onChange={(md) => setNewMessage(md)}
            onKeyDown={handleComposerKeyDown}
            onFilesAdded={(files) => {
              void addAttachments(files);
            }}
            onUploadFiles={onUploadFiles}
            fileHandlingMode="attachments"
            workspaceId={workspaceId}
            disabled={disabled}
            placeholder="What would you like to do?"
            className="md-editor--bare px-5 pb-3 pt-4 text-sm"
            /* The reference's 76px textarea block carries its own controls; ours
               stacks an action bar under the editor, so reserving the rest of
               that block here left a blank second line above it — most obvious
               on a workspace with no variables, where the bar holds nothing but
               the send buttons. One line is the floor; the editor grows from
               there as it is typed into, up to the wrapper's 400px. */
            minHeight={24}
          />
        </div>

        {/* Dictation state is carried by the microphone itself and by the ghost
            text at the caret, so nothing is reported in two places. This region
            is for assistive tech only: permanently mounted (content arriving in
            the same tick a region appears usually is not announced) and carrying
            only the state change, never the transcript, which rewrites several
            times a second. */}
        <div role="status" className="sr-only">
          {dictation.state === 'listening'
            ? 'Listening'
            : dictation.state === 'starting'
            ? 'Starting dictation'
            : ''}
        </div>

        {/* Errors are the one thing the button cannot convey on its own: a
            tooltip is invisible to touch and to screen readers, and
            permission-denied is the common first-run outcome. */}
        {dictation.error && (
          <div role="alert" className="px-5 pb-1 text-xs text-destructive">
            {dictationErrorMessages[dictation.error]}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between gap-2 px-3 pb-3">
          <div className="ss-composer__actions flex min-w-0 flex-1 items-center gap-1">
            {supportsFiles && (
              <IconButton
                type="button"
                onClick={handlePickFilesClick}
                disabled={disabled}
                aria-label="Upload files"
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary"
              >
                <Paperclip className="h-4 w-4" strokeWidth={2} />
              </IconButton>
            )}

            {/* Workspace variables (model, web search, streaming, …) sit in the
                action bar rather than above the card, as in the design. */}
            {workspace && threadId && (
              <ChatVariablesForm
                key={`${workspaceId}-${threadId}`}
                workspace={workspace}
                threadId={threadId}
                setVariables={setVariables}
              />
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* The design pairs a dictation button with Send. On installs
                without speech configured (or a service that doesn't offer it)
                it keeps the shape as a disabled placeholder that says so. */}
            {dictation.available ? (
              <DictationButton
                state={dictation.state}
                error={dictation.error}
                disabled={disabled}
                onToggle={handleDictationToggle}
              />
            ) : (
              <IconButton
                type="button"
                disabled
                aria-label="Dictate a message"
                title="Dictation is not available"
                className="h-8 w-8 cursor-not-allowed rounded-full text-muted-foreground"
              >
                <Mic className="h-4 w-4" />
              </IconButton>
            )}

            {canStop ? (
              <IconButton
                onClick={handleStopRun}
                className="chat-send h-8 w-8 rounded-full"
                disabled={stopping}
                aria-label={stopping ? 'Stopping' : 'Stop'}
              >
                <Square
                  className={`h-4 w-4 fill-current ${
                    stopping ? 'animate-pulse' : ''
                  }`}
                />
              </IconButton>
            ) : (
              <IconButton
                onClick={handleSendMessageAndClear}
                className={`chat-send h-8 w-8 rounded-full ${
                  sendDisabled ? 'cursor-not-allowed' : ''
                }`}
                disabled={sendDisabled}
                aria-label="Send"
              >
                {isSending ? (
                  <span className="chat-thinking-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </IconButton>
            )}
          </div>
        </div>

        {/* Mobile fullscreen composer */}
        {isMobile &&
          isFullscreen &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className="fixed inset-x-0"
              style={{
                top: '5vh',
                height: '95vh',
                left: 0,
                right: 0,
                zIndex: 1300,
              }}
            >
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
                      ref={attachEditor}
                      value={newMessage}
                      onChange={(md) => setNewMessage(md)}
                      onKeyDown={handleComposerKeyDown}
                      onFilesAdded={(files) => {
                        void addAttachments(files);
                      }}
                      onUploadFiles={onUploadFiles}
                      fileHandlingMode="attachments"
                      workspaceId={workspaceId}
                      disabled={disabled}
                      className="md-editor--bare text-sm h-full"
                    />
                  </div>
                  {/* Errors only. State is on the microphone and the transcript
                      is ghosted at the caret in the editor above, so there is no
                      status text to duplicate. aria-hidden because the announcing
                      region lives in the card behind this portal. */}
                  {dictation.error && (
                    <div
                      aria-hidden="true"
                      className="px-4 pb-1 text-xs text-destructive"
                    >
                      {dictationErrorMessages[dictation.error]}
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 border-t bg-background">
                    <div className="flex-1" />
                    {supportsFiles && (
                      <IconButton
                        type="button"
                        onClick={handlePickFilesClick}
                        disabled={disabled}
                        aria-label="Upload files"
                      >
                        <Paperclip
                          className="h-5 w-5 text-muted-foreground/70"
                          strokeWidth={2}
                        />
                      </IconButton>
                    )}
                    {dictation.available && (
                      <DictationButton
                        size="md"
                        state={dictation.state}
                        error={dictation.error}
                        disabled={disabled}
                        onToggle={handleDictationToggle}
                      />
                    )}
                    {canStop ? (
                      <IconButton
                        onClick={handleStopRun}
                        className="chat-send h-9 w-9 rounded-full"
                        disabled={stopping}
                        aria-label={stopping ? 'Stopping' : 'Stop'}
                      >
                        <Square
                          className={`h-4 w-4 fill-current ${
                            stopping ? 'animate-pulse' : ''
                          }`}
                        />
                      </IconButton>
                    ) : (
                      <IconButton
                        onClick={handleSendMessageAndClear}
                        className={`chat-send h-9 w-9 rounded-full ${
                          sendDisabled ? 'cursor-not-allowed' : ''
                        }`}
                        disabled={sendDisabled}
                        aria-label="Send"
                      >
                        <Send className="h-4 w-4" />
                      </IconButton>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>

      {/* Context strip — below the card rather than inside it, as in the
        reference. Keyboard hints only; the design also shows a token budget
        there, but the app has no token accounting to report. */}
      <div className="flex items-center justify-end px-2 pt-2 text-[10px] font-medium tracking-wide text-muted-foreground max-sm:hidden">
        <span className="flex items-center gap-1.5">
          <kbd className="font-sans">⏎</kbd> to send
          <span className="opacity-40">·</span>
          <kbd className="font-sans">Shift</kbd>+
          <kbd className="font-sans">⏎</kbd> for newline
        </span>
      </div>
    </div>
  );
}
