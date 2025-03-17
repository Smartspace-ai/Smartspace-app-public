import {
  FileText,
  Image,
  Mic,
  Paperclip,
  PlusCircle,
  Send,
  Smile,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';

export function ChatComposer() {
  const [newMessage, setNewMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  };

  return (
    <div className="border-t p-4 bg-background shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col rounded-lg border bg-background">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[60px] max-h-[200px] w-full resize-none rounded-t-lg border-0 bg-transparent px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-0"
            rows={1}
          />
        </div>

        <div className="flex items-center justify-between border-t px-3 py-2">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          toast.info('Attachment feature coming soon')
                        }
                      >
                        <PlusCircle className="h-5 w-5" />
                        <span className="sr-only">Add attachment</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-56 p-2">
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex flex-col h-auto gap-1 p-2"
                          onClick={() => toast.info('Image upload coming soon')}
                        >
                          <Image className="h-5 w-5" />
                          <span className="text-xs">Image</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex flex-col h-auto gap-1 p-2"
                          onClick={() => toast.info('File upload coming soon')}
                        >
                          <FileText className="h-5 w-5" />
                          <span className="text-xs">File</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex flex-col h-auto gap-1 p-2"
                          onClick={() =>
                            toast.info('Audio recording coming soon')
                          }
                        >
                          <Mic className="h-5 w-5" />
                          <span className="text-xs">Audio</span>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent side="top">Add attachment</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => toast.info('File attachment coming soon')}
                  >
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach file</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => toast.info('Emoji picker coming soon')}
                  >
                    <Smile className="h-5 w-5" />
                    <span className="sr-only">Add emoji</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Add emoji</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Button
            size="sm"
            className={`gap-2 ${
              !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!newMessage.trim()}
          >
            <span>Send</span>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatComposer;
