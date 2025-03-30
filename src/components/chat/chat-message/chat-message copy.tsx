import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, Copy, Eye } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  message: any;
  copyMessageToClipboard: (message: string, id: number) => void;
  copiedMessageId: number | null;
}

export function ChatMessage({
  message,
  copyMessageToClipboard,
  copiedMessageId,
}: ChatMessageProps) {
  const [isRawMode, setIsRawMode] = useState(false);

  const toggleRawMode = () => {
    setIsRawMode(!isRawMode);
  };

  // Format timestamp
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
      : message.timestamp || 'Unknown time';

  // Process message values
  const values = message.values || [];

  // Find prompt value (user message)
  const promptValue = values.find((v: any) => v.name === 'prompt');

  // Find response value (bot message)
  const responseValue = values.find(
    (v: any) => v.name === 'Response' && v.type === 'Output'
  );

  // Find files value
  const filesValue = values.find((v: any) => v.name === 'Files');

  // Determine if this is a user message or bot response
  const isUserMessage = !responseValue;

  // Extract content from prompt value
  const getPromptContent = () => {
    if (!promptValue) return '';

    if (Array.isArray(promptValue.value)) {
      return promptValue.value
        .filter((item: any) => item.text)
        .map((item: any) => item.text)
        .join('\n');
    }

    return typeof promptValue.value === 'string' ? promptValue.value : '';
  };

  // Extract content from response value
  const getResponseContent = () => {
    if (!responseValue) return '';
    return typeof responseValue.value === 'string' ? responseValue.value : '';
  };

  // Extract images from prompt value
  const getPromptImages = () => {
    if (!promptValue || !Array.isArray(promptValue.value)) return [];

    return promptValue.value
      .filter((item: any) => item.image)
      .map((item: any) => item.image);
  };

  // Get the appropriate content based on message type
  const messageContent = isUserMessage
    ? getPromptContent()
    : getResponseContent();
  const images = isUserMessage ? getPromptImages() : [];

  if (isUserMessage) {
    // User message without container
    return (
      <div className="flex items-start gap-3 py-3 mb-6">
        <Avatar className="h-6 w-6 mt-0.5">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            {message.createdBy?.substring(0, 2) || 'YO'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {message.createdBy || 'You'}
            </span>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>

          <div className="text-sm">
            {messageContent || 'No content available'}
          </div>

          {/* Display images if present */}
          {images.length > 0 && (
            <div className="mt-2 space-y-2">
              {images.map((image: any, index: number) => (
                <div
                  key={index}
                  className="mt-2 border rounded-md overflow-hidden"
                >
                  <img
                    src={`/api/files/${image.id}`}
                    alt={`Attachment ${index + 1}`}
                    className="max-w-full h-auto max-h-64 object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User message has only copy button that appears on hover */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() =>
            copyMessageToClipboard(messageContent, Number(message.id))
          }
        >
          {copiedMessageId === Number(message.id) ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    );
  } else {
    // Bot message with container
    return (
      <div className="rounded-lg border bg-background shadow-md mb-8">
        {/* Message header with avatar, name, time, and actions */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                SS
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">SmartSpace</span>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>

          {/* Action buttons - simplified to only Preview/Raw toggle and Copy */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 rounded-md"
              onClick={toggleRawMode}
            >
              <Eye className="h-3.5 w-3.5" />
              {isRawMode ? 'Raw' : 'Preview'}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() =>
                copyMessageToClipboard(messageContent, Number(message.id))
              }
              title="Copy"
            >
              {copiedMessageId === Number(message.id) ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Message content */}
        <div className="p-3">
          {isRawMode ? (
            <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">
              {messageContent || 'No content available'}
            </pre>
          ) : (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: messageContent || 'No content available',
              }}
            />
          )}
        </div>
      </div>
    );
  }
}

export default ChatMessage;
