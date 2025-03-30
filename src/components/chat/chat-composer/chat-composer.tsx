import { Button } from '@/components/ui/button';
import { FileText, Paperclip } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef } from 'react';

type ChatComposerProps = {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isSending: boolean;
  disabled: boolean;
};

export default function ChatComposer({
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleKeyDown,
  isSending,
  disabled,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [newMessage]);

  return (
    <div className="w-full mt-auto bg-background border-t p-4 h-55">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col rounded-md border shadow-sm overflow-hidden">
          {/* Message Input Area - larger with subtle background */}
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? 'Select a thread to start chatting...'
                : 'Type a message...'
            }
            className="min-h-[60px] max-h-[200px] w-full resize-none rounded-t-lg border-0 bg-transparent px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-0"
            rows={1}
            disabled={disabled}
          />

          {/* Action Buttons - simplified to only essential buttons */}
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
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce"></span>
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
