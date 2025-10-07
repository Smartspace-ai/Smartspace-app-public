'use client';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { ArrowBigUp, Maximize2, Minimize2 } from 'lucide-react';
import { createPortal } from 'react-dom';

import { useFileMutations } from '@/domains/files/mutations';

import { ChatVariablesForm } from '@/ui/chat-variables/VariablesForm';

import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';

import { useMessageComposerVm } from './MessageComposer.vm';

export default function MessageComposer() {
  const vm = useMessageComposerVm();
 
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
  } = vm;

  const { uploadFilesMutation } = useFileMutations({ workspaceId, threadId });
  // Provide a global downloader for ssImage node views (non-React context)
  if (typeof window !== 'undefined') {
    (window as any).__ssDownloadFile = async (id: string) => {
      const blob = await fetch(`/api/files/${id}/download?workspaceId=${workspaceId ?? ''}&threadId=${threadId ?? ''}`).then(r => r.blob());
      return URL.createObjectURL(blob);
    };
  }
  const onUploadFiles = async (files: File[]) => {
    const res = await uploadFilesMutation.mutateAsync(files);
    return res.map(({ id, name }) => ({ id, name }));
  };

  return (
    <div className="ss-chat__composer max-h-[60%] flex-shrink-0 w-full mt-auto bg-sidebar border-t px-4 py-4">
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
        <div className="w-full max-h-[400px] overflow-y-auto">
          <div>
            {isMobile ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="relative flex-1 px-2 py-2">
                  <MarkdownEditor
                    value={newMessage}
                    onChange={(md) => setNewMessage(md)}
                    onKeyDown={handleKeyDown}
                    onUploadFiles={onUploadFiles}
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

                <IconButton
                  onClick={handleSendMessage}
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
                  value={newMessage}
                  onChange={(md) => setNewMessage(md)}
                  onKeyDown={handleKeyDown}
                  onUploadFiles={onUploadFiles}
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
                      value={newMessage}
                      onChange={(md) => setNewMessage(md)}
                      onKeyDown={handleKeyDown}
                      onUploadFiles={onUploadFiles}
                      workspaceId={workspaceId}
                      disabled={disabled}
                      className="md-editor--bare text-sm h-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 border-t bg-background">
                    <div className="flex-1" />
                    <IconButton
                      onClick={handleSendMessage}
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
            <div className="flex items-center gap-3" />

            <Button
              onClick={handleSendMessage}
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
