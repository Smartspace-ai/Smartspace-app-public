import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';

// Sample message data
const sampleMessages = [
  {
    id: 1,
    sender: {
      name: 'John Doe',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content:
      "Hey team, I've just pushed the latest updates to the repository. Can someone review my PR?",
    timestamp: '10:32 AM',
    isCurrentUser: false,
  },
  {
    id: 2,
    sender: {
      name: 'Sarah Johnson',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content:
      "I'll take a look at it in about an hour, currently finishing up the documentation.",
    timestamp: '10:45 AM',
    isCurrentUser: false,
  },
  {
    id: 3,
    sender: {
      name: 'You',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content:
      "Thanks Sarah! No rush, just wanted to make sure it's reviewed before the end of the day.",
    timestamp: '10:47 AM',
    isCurrentUser: true,
  },
  {
    id: 4,
    sender: {
      name: 'Alex Chen',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content:
      "I noticed we're still having that issue with the navigation component on mobile. Has anyone had a chance to look into it?",
    timestamp: '11:15 AM',
    isCurrentUser: false,
  },
  {
    id: 5,
    sender: {
      name: 'You',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content:
      "I think it's related to the overflow handling. I'll create a ticket to track it and we can discuss during the next standup.",
    timestamp: '11:22 AM',
    isCurrentUser: true,
  },
  {
    id: 6,
    sender: {
      name: 'Maria Garcia',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content:
      'Just a reminder that we have a client demo tomorrow at 2 PM. Make sure the staging environment is updated with all the latest features.',
    timestamp: '12:01 PM',
    isCurrentUser: false,
  },
  {
    id: 7,
    sender: {
      name: 'John Doe',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content: "I'll handle the deployment to staging this afternoon.",
    timestamp: '12:05 PM',
    isCurrentUser: false,
  },
  {
    id: 8,
    sender: {
      name: 'You',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content:
      'Perfect, thanks John! Let me know if you need any help with that.',
    timestamp: '12:10 PM',
    isCurrentUser: true,
  },
  {
    id: 9,
    sender: {
      name: 'Sarah Johnson',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content:
      "By the way, I've completed the review of the design system documentation. I've added some comments and suggestions. When you have time, could you take a look?",
    timestamp: '1:30 PM',
    isCurrentUser: false,
  },
  {
    id: 10,
    sender: {
      name: 'You',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content: "Will do! I'll check it out right after lunch.",
    timestamp: '1:35 PM',
    isCurrentUser: true,
  },
];

// Generate more messages for testing scrolling
const generateMoreMessages = (count: number) => {
  const additionalMessages = [];
  for (let i = 0; i < count; i++) {
    const baseMessage = sampleMessages[i % sampleMessages.length];
    additionalMessages.push({
      ...baseMessage,
      id: sampleMessages.length + i + 1,
      content: `${baseMessage.content} (${i + 1})`,
      timestamp: `${(i % 12) + 1}:${(i % 60).toString().padStart(2, '0')} ${
        i % 24 < 12 ? 'AM' : 'PM'
      }`,
    });
  }
  return additionalMessages;
};

const allMessages = [...sampleMessages, ...generateMoreMessages(30)];
export function ChatBody() {
  const [messages, setMessages] = useState(allMessages);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Auto-scroll to bottom on initial load
  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset copied state after a delay
  useEffect(() => {
    if (copiedMessageId !== null) {
      const timer = setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedMessageId]);

  const copyMessageToClipboard = (message: string, id: number) => {
    navigator.clipboard.writeText(message).then(() => {
      setCopiedMessageId(id);
      toast('Message copied to clipboard', {
        icon: <Copy className="h-4 w-4" />,
        duration: 2000,
      });
    });
  };

  return (
    <div className="chat__body flex-grow flex flex-col min-h-0 bg-white">
      <ScrollArea className="chat__scroll-area flex-grow p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`group flex items-start gap-3 mb-8 ${
              message.isCurrentUser ? 'justify-end' : ''
            }`}
          >
            {!message.isCurrentUser && (
              <Avatar className="h-8 w-8 mt-0.5">
                <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}

            <div
              className={`relative flex flex-col max-w-[75%] ${
                message.isCurrentUser ? 'items-end' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">
                  {message.sender.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {message.timestamp}
                </span>
              </div>
              <div
                className={`group-hover:shadow-sm transition-shadow duration-200 rounded-lg px-4 py-2 text-sm ${
                  message.isCurrentUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}

                {/* Message hover actions - right aligned with no rounded corners */}
                <div
                  className="absolute right-0 -top-[6px] opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 
                    transition-all duration-150 ease-in-out flex items-center bg-background/90 backdrop-blur-sm 
                    border shadow-sm rounded-md"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-none"
                          onClick={() =>
                            copyMessageToClipboard(message.content, message.id)
                          }
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span className="sr-only">Copy message</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs py-1 px-2">
                        {copiedMessageId === message.id ? 'Copied!' : 'Copy'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {message.isCurrentUser && (
              <Avatar className="h-8 w-8 mt-0.5">
                <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>
    </div>
  );
}

export default ChatBody;
