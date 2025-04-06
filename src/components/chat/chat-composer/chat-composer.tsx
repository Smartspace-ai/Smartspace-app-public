'use client';

import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Paperclip, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

type ChatComposerProps = {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isSending: boolean;
  disabled: boolean;
  selectedImages: File[];
  setSelectedImages: (files: File[]) => void;
};

export default function ChatComposer({
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleKeyDown,
  isSending,
  disabled,
  selectedImages,
  setSelectedImages,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [newMessage]);

  // Create image previews when images are selected
  useEffect(() => {
    // Clear previous preview URLs to avoid memory leaks
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));

    // Create new preview URLs based on selectedImages only
    const newPreviewUrls = selectedImages.map((file) =>
      URL.createObjectURL(file)
    );
    setImagePreviewUrls(newPreviewUrls);

    // Cleanup function to revoke object URLs when component unmounts or images change
    return () => {
      newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls, selectedImages]); // Removed imagePreviewUrls from dependencies

  // Handle file selection from the file input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const imageFiles = filesArray.filter((file) =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length === 0) {
        alert('Please select image files');
        return;
      }

      setSelectedImages([...selectedImages, ...imageFiles]);
    }
  };

  // Handle click on the paperclip icon
  const handlePaperclipClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle drag events for the dropzone
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

    // Check if this event has already been handled by the parent
    if (e.defaultPrevented) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const imageFiles = filesArray.filter((file) =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length === 0) {
        alert('Please drop image files');
        return;
      }

      setSelectedImages([...selectedImages, ...imageFiles]);
    }
  };

  // Remove a selected image by index
  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages(
      selectedImages.filter((_, index) => index !== indexToRemove)
    );
  };

  // Remove all selected images
  const handleRemoveAllImages = () => {
    setSelectedImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full mt-auto border-t px-4 py-4 bg-sidebar">
      <div className="max-w-3xl mx-auto">
        <div
          ref={dropzoneRef}
          className={`flex flex-col rounded-md border shadow-sm overflow-hidden bg-white ${
            isDragging
              ? 'border-primary border-dashed ring-2 ring-primary/20'
              : ''
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Image preview area - updated for multiple images with animations */}
          <AnimatePresence>
            {selectedImages.length > 0 && (
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
                      {selectedImages.length}{' '}
                      {selectedImages.length === 1 ? 'image' : 'images'}{' '}
                      selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      onClick={handleRemoveAllImages}
                    >
                      Remove all
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {imagePreviewUrls.map((url, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="relative aspect-square group"
                      >
                        <img
                          src={url || '/placeholder.svg'}
                          alt={`Preview of selected file ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isDragging
                ? 'Drop images here...'
                : disabled
                ? 'Select a thread to start chatting...'
                : 'Type a message...'
            }
            className="min-h-[60px] max-h-[120px] w-full resize-none border-0 bg-transparent px-5 py-4 text-sm focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            rows={1}
            disabled={disabled}
          />

          <div className="flex items-center justify-between px-4 py-2 bg-background">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                disabled={disabled}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                disabled={disabled}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleSendMessage}
              variant="default"
              size="sm"
              className={`text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 h-7 ${
                !newMessage.trim() || disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              disabled={!newMessage.trim() || disabled}
            >
              {isSending ? (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
                </span>
              ) : (
                'Send'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
