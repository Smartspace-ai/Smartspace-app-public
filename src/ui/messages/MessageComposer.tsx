'use client';

import { getFileIcon } from '@/domains/files/utils';
import { Button } from '@/shared/ui/shadcn/button';
import { ChatVariablesForm } from '@/ui/chat-variables/VariablesForm';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowBigUp, Check, Maximize2, Minimize2, Paperclip, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useMessageComposerVm } from './MessageComposer.vm';

export default function MessageComposer() {
  const vm = useMessageComposerVm();

  const {
    // context
    workspace, threadId, isMobile, leftOpen, rightOpen,

    // text
    newMessage, setNewMessage, handleKeyDown, handleSendMessage, isSending, disabled,

    // refs
    textareaRef, dropzoneRef, fileInputRef,

    // ui state
    isDragging, isFullscreen, setIsFullscreen, showExpand,

    // files
    supportsFiles, selectedFiles, filePreviewUrls, isUploadingFiles,
    onFileInputChange, handlePaperclipClick, onDragEnter, onDragLeave, onDragOver, onDrop, onPaste,
    removeFileAt, removeAllFiles,

    // images (server-side)
    imagesForMessage,

    // derived
    sendDisabled,

    // helpers
    adjustTextareaHeight,

    // variables form
    variablesFormRef,
  } = vm;

  return (
    <div className="ss-chat__composer max-h-[60%] flex-shrink-0 w-full mt-auto bg-sidebar border-t px-4 py-4">
      {workspace && threadId && (
        <div
          className={`${isMobile ? 'w-full max-w-full' : 'w-full'} ${
            !isMobile ? `${leftOpen || rightOpen ? 'max-w-[90%]' : 'max-w-[70%]'} mx-auto` : ''
          } transition-[max-width] duration-300 ease-in-out`}
        >
          <ChatVariablesForm workspace={workspace} threadId={threadId} ref={variablesFormRef} />
        </div>
      )}
      {Object.keys(workspace?.variables ?? {}).length > 0 && <hr className="my-2" />}

      <div
        className={`${isMobile ? 'w-full max-w-full' : 'w-full'} ${
          !isMobile ? `${leftOpen || rightOpen ? 'max-w-[90%]' : 'max-w-[70%]'} mx-auto` : ''
        } bg-background ${isMobile ? '' : 'rounded-md border shadow-sm'} transition-[max-width] duration-300 ease-in-out`}
      >
        <div className="w-full max-h-[400px] overflow-y-auto">
          <div
            ref={dropzoneRef}
            className={`flex flex-col overflow-hidden transition-all ${
              isDragging ? 'border-primary border-dashed ring-2 ring-primary/20' : ''
            }`}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onPaste={onPaste}
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
                        {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
                        {isUploadingFiles && ' (uploading...)'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        onClick={removeAllFiles}
                        disabled={isUploadingFiles}
                      >
                        Remove all
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 auto-rows-min">
                      {filePreviewUrls.map((file, index) => {
                        const FileIcon = getFileIcon(file.name);
                        const isImage = file.isImage;
                        return (
                          <motion.div
                            key={`${file.name}-${index}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className={`relative group ${isImage ? 'row-span-2' : ''}`}
                          >
                            <div
                              className={`flex items-center gap-2 p-2 rounded-md border bg-muted/20 hover:bg-muted/30 transition-colors ${
                                isImage ? 'flex-col h-full' : ''
                              }`}
                            >
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
                                <div className="text-xs font-medium text-foreground truncate">{file.name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                </div>
                              </div>
                              {/* Optional: show a check for server-attached images */}
                              {imagesForMessage.length > 0 && isImage && (
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
                                onClick={() => removeFileAt(index)}
                                disabled={isUploadingFiles}
                                aria-label="Remove file"
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

            {isMobile ? (
              <div className="flex items-center gap-2 px-3 py-2">
                {supportsFiles && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground self-end"
                    disabled={disabled || isUploadingFiles}
                    onClick={handlePaperclipClick}
                    aria-label="Attach files"
                  >
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={onFileInputChange}
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
                    onInput={(e) => adjustTextareaHeight(e.currentTarget)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isDragging
                        ? 'Drop files here...'
                        : disabled
                        ? 'Select a thread to start chatting...'
                        : 'Type a message...'
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
                  onClick={handleSendMessage}
                  variant="default"
                  size="icon"
                  className={`h-10 w-10 rounded-full self-end ${sendDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  onInput={(e) => adjustTextareaHeight(e.currentTarget)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isDragging ? 'Drop files here...' : disabled ? 'Select a thread to start chatting...' : 'Type a message...'
                  }
                  className="w-full resize-none border-0 rounded-none bg-transparent px-5 py-2 text-sm focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors max-h-60 overflow-y-auto"
                  style={{ fontSize: 16, WebkitTextSizeAdjust: '100%' }}
                  disabled={disabled}
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
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={disabled ? 'Select a thread to start chatting...' : 'Type a message...'}
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
                        aria-label="Attach files"
                      >
                        <Paperclip className="h-4 w-4" />
                        <input type="file" ref={fileInputRef} onChange={onFileInputChange} multiple className="hidden" />
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button
                      onClick={handleSendMessage}
                      variant="default"
                      size="icon"
                      className={`h-10 w-10 rounded-full ${sendDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={sendDisabled}
                      aria-label="Send"
                    >
                      <ArrowBigUp className="h-5 w-5" strokeWidth={2.5} />
                    </Button>
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
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  disabled={disabled || isUploadingFiles}
                  onClick={handlePaperclipClick}
                  aria-label="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                  <input type="file" ref={fileInputRef} onChange={onFileInputChange} multiple className="hidden" />
                </Button>
              )}
            </div>

            <Button
              onClick={handleSendMessage}
              variant="default"
              size="sm"
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
