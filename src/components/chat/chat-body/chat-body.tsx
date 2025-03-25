import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Message } from '@/lib/api';
import {
  Check,
  Code,
  Copy,
  Edit,
  Eye,
  MoreVertical,
  Share,
  Trash2,
} from 'lucide-react';
import type React from 'react';

type ChatBodyProps = {
  messages: Message[];
  copiedMessageId: number | null;
  rawModeMessages: number[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  copyMessageToClipboard: (message: string, id: number) => void;
  handleEditMessage: (id: number) => void;
  handleDeleteMessage: (id: number) => void;
  toggleRawMode: (id: number) => void;
  isRawMode: (id: number) => boolean;
  getMessageContent: (message: any) => string;
  isLoading: boolean;
  isBotResponding: boolean;
};

export default function ChatBody({
  messages,
  copiedMessageId,
  rawModeMessages,
  messagesEndRef,
  copyMessageToClipboard,
  handleEditMessage,
  handleDeleteMessage,
  toggleRawMode,
  isRawMode,
  getMessageContent,
  isLoading,
  isBotResponding,
}: ChatBodyProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto w-full px-4">
        <div className="max-w-3xl mx-auto space-y-8 py-4">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="group">
                <div className="flex flex-col rounded-lg p-3">
                  <div className="flex items-center justify-between pb-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="pl-9 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full px-4">
      {/* Date separator */}
      <div className="flex justify-center my-2 sticky top-2 z-10">
        <div className="text-xs text-muted-foreground bg-transparent backdrop-blur-md px-3 py-0.5 rounded-full shadow-sm border border-border/20">
          Today{' '}
          {new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Fixed width container for messages */}
      <div className="max-w-3xl mx-auto space-y-8">
        {messages.map((message) => (
          <div key={message.id} className="group">
            {message.isCurrentUser ? (
              // User message - clean with no border
              <div className="flex flex-col rounded-lg p-3">
                {/* Message header with avatar, name, time, and actions */}
                <div className="flex items-center justify-between pb-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={message.sender.avatar} alt="You" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        YO
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium">You</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {message.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        copyMessageToClipboard(message.content, message.id)
                      }
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEditMessage(message.id)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteMessage(message.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Message content aligned with avatar */}
                <div className="text-sm pl-9">{message.content}</div>
              </div>
            ) : (
              // Bot message - paper style container with elevation
              <div className="rounded-lg border bg-background shadow-md overflow-hidden">
                {/* Message header with avatar, name, time, and actions */}
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage
                        src="/placeholder.svg?height=40&width=40"
                        alt="SmartSpace"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        SS
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium">SmartSpace</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {message.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs gap-1"
                      onClick={() => toggleRawMode(message.id)}
                    >
                      {isRawMode(message.id) ? (
                        <Eye className="h-3 w-3 mr-1" />
                      ) : (
                        <Code className="h-3 w-3 mr-1" />
                      )}
                      {isRawMode(message.id) ? 'Preview' : 'Raw'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        copyMessageToClipboard(message.content, message.id)
                      }
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    >
                      <Share className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Bot message content */}
                <div className="p-3 pl-12">
                  {isRawMode(message.id) ? (
                    <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                      {getMessageContent(message)}
                    </pre>
                  ) : (
                    <div
                      className="text-sm"
                      dangerouslySetInnerHTML={{
                        __html: getMessageContent(message),
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Bot typing indicator */}
        {isBotResponding && (
          <div className="rounded-lg border bg-background shadow-md overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage
                    src="/placeholder.svg?height=40&width=40"
                    alt="SmartSpace"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    SS
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-medium">SmartSpace</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Just now
                  </span>
                </div>
              </div>
            </div>
            <div className="p-3 pl-12">
              <div className="flex space-x-2">
                <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
