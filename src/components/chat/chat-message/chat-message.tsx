'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import {
  Check,
  Code,
  Copy,
  Edit,
  Eye,
  MoreVertical,
  Share,
  Smile,
  Trash2,
} from 'lucide-react';
import { Message } from '../../../models/message';
// Update the import for Message type to use the user's definition

// Update the type definition to handle the simplified Message model
type MessageProps = {
  message: Message;
  copiedMessageId: number | null;
  isRawMode: boolean;
  copyMessageToClipboard: (message: string, id: number) => void;
  handleEditMessage: (id: number) => void;
  handleDeleteMessage: (id: number) => void;
  toggleRawMode: (id: number) => void;
  getMessageContent: (message: any) => string;
  onAddReaction?: (messageId: string, reaction: string) => void;
};

export function ChatMessage({
  message,
  copiedMessageId,
  isRawMode,
  copyMessageToClipboard,
  handleEditMessage,
  handleDeleteMessage,
  toggleRawMode,
  getMessageContent,
  onAddReaction,
}: MessageProps) {
  // Determine if the message is from the current user
  const isCurrentUser = message.createdByUserId === 'current-user-id'; // Replace with actual user ID check

  // Get formatted timestamp
  const timestamp =
    message.createdAt instanceof Date
      ? message.createdAt.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : typeof message.createdAt === 'string'
      ? new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Unknown time';

  // Check if message is optimistic (being sent) - use type assertion for UI-only properties
  const isOptimistic = (message as any).optimistic === true;

  // Check if message is typing - use type assertion for UI-only properties
  const isTyping = (message as any).isTyping === true;

  if (isCurrentUser) {
    return (
      <div className="flex flex-col rounded-lg p-3">
        {/* Message header with avatar, name, time, and actions */}
        <div className="flex items-center justify-between pb-2 mb-1.5">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage
                src="/placeholder.svg?height=40&width=40"
                alt="You"
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                YO
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-medium">
                {message.createdBy || 'You'}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {timestamp}
              </span>
              {isOptimistic && (
                <span className="text-xs text-muted-foreground ml-2 italic">
                  (sending...)
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() =>
                copyMessageToClipboard(
                  message.content || '',
                  Number(message.id)
                )
              }
            >
              {copiedMessageId === Number(message.id) ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => handleEditMessage(Number(message.id))}
              disabled={isOptimistic}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => handleDeleteMessage(Number(message.id))}
              disabled={isOptimistic}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Message content aligned with avatar */}
        <div className="text-sm pl-9">{message.content || ''}</div>
      </div>
    );
  } else {
    // Bot message - paper style container with elevation
    return (
      <div
        className={`rounded-lg border bg-background shadow-md overflow-hidden ${
          isTyping ? 'animate-pulse' : ''
        }`}
      >
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
              <span className="text-sm font-medium">
                {message.createdBy || 'SmartSpace'}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {timestamp}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Reaction button */}
            {onAddReaction && !isTyping && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <Smile className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
              </Popover>
            )}

            {!isTyping && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={() => toggleRawMode(Number(message.id))}
              >
                {isRawMode ? (
                  <Eye className="h-3 w-3 mr-1" />
                ) : (
                  <Code className="h-3 w-3 mr-1" />
                )}
                {isRawMode ? 'Preview' : 'Raw'}
              </Button>
            )}

            {!isTyping && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() =>
                  copyMessageToClipboard(
                    message.content || '',
                    Number(message.id)
                  )
                }
              >
                {copiedMessageId === Number(message.id) ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}

            {!isTyping && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <Share className="h-3 w-3" />
              </Button>
            )}

            {!isTyping && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Bot message content */}
        <div className="p-3 pl-12">
          {isTyping ? (
            <div className="flex space-x-2">
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"></div>
            </div>
          ) : isRawMode ? (
            <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">
              {getMessageContent(message)}
            </pre>
          ) : (
            <div
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: getMessageContent(message) }}
            />
          )}
        </div>
      </div>
    );
  }
}

export default ChatMessage;
