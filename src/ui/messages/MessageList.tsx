import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { MessageValueType } from '@/domains/messages/enums';
import { useMessages } from '@/domains/messages/queries';
import { useThread } from '@/domains/threads/queries';
import { useWorkspace } from '@/domains/workspaces/queries';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { useIsMobile } from '@/hooks/use-mobile';

import MessageItem from './MessageItem';
import { Avatar, AvatarFallback } from '../../shared/ui/shadcn/avatar';
import { useSidebar } from '../../shared/ui/shadcn/sidebar';
import { Skeleton } from '../../shared/ui/shadcn/skeleton';
import { getInitials } from '../../shared/utils/initials';
import { parseDateTime } from '../../shared/utils/parse-date-time';




export default function MessageList() {
    const { workspaceId, threadId } = useRouteIds();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollTopRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  const { data: activeWorkspace } = useWorkspace(workspaceId);


  const [isAtBottom, setIsAtBottom] = useState(true);

  const { data: thread, isPending: threadLoading, error: threadError } = useThread({ workspaceId, threadId })
  const { data: messages = [], isPending: messagesLoading, error: messagesError } = useMessages(threadId)


  const { leftOpen, rightOpen } = useSidebar();

  useEffect(() => {
    if ( viewportRef.current) {
      viewportRef.current.scrollTo({top: scrollTopRef.current, behavior: 'auto'});
    }
  }, []);


  // Scroll to bottom when messages are loaded or updated
  useEffect(() => {
    if (messages && messages.length > 0 ) {
      // Use a small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        if (messagesEndRef.current && viewportRef.current) {
          // Only auto-scroll if user is already at or near the bottom
          const viewport = viewportRef.current;
          const threshold = 100; // px from bottom to still count as 'at bottom'
          const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < threshold;
          
          if (isNearBottom || isAtBottom) {
            // Calculate the exact bottom position
            const scrollHeight = viewport.scrollHeight;
            const clientHeight = viewport.clientHeight;
            const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
            
            // Use scrollTo for more precise control
            viewport.scrollTo({
              top: maxScrollTop,
              behavior: 'smooth'
            });
            
            // Fallback: try scrollIntoView if scrollTo doesn't work
            setTimeout(() => {
              if (viewportRef.current) {
                const currentScrollTop = viewportRef.current.scrollTop;
                const currentScrollHeight = viewportRef.current.scrollHeight;
                const currentClientHeight = viewportRef.current.clientHeight;
                const expectedScrollTop = Math.max(0, currentScrollHeight - currentClientHeight);
                
                // If we're not at the bottom, try scrollIntoView
                if (Math.abs(currentScrollTop - expectedScrollTop) > 10) {
                  messagesEndRef.current?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'end',
                    inline: 'nearest'
                  });
                }
              }
            }, 100);
          }
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, messages?.length, isAtBottom, threadLoading, messagesLoading, threadError, messagesError]);

  if (threadLoading ||messagesLoading) {
    return (
      <div className="ss-chat__body flex-shrink-10 flex-1 overflow-y-auto">
        <div className="space-y-8 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (threadError || messagesError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-3">
          {threadError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Failed to load thread</span>
            </div>
          )}
          {messagesError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Failed to load messages</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if ((messages?.length ?? 0) === 0) {
    return (
      <div className="flex overflow-auto flex-shrink-10 flex-col p-8 text-center">
        <h3 className="text-lg font-medium mb-2">{activeWorkspace?.name ?? 'No messages yet'}</h3>
        {activeWorkspace?.firstPrompt && (
          <div className="max-w-3xl mx-auto p-4 whitespace-pre-wrap">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {activeWorkspace.firstPrompt}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  const messageHasSomeResponse = (messages?.length ?? 0) > 0 && messages[messages.length - 1]?.values?.some(v => v.type === MessageValueType.OUTPUT)

  return (
    <div className="ss-chat__body" style={{ flex: 1, minHeight: 0, minWidth: 0, height: '100%', width: '100%', overflow: 'hidden' }}>
      <ScrollAreaPrimitive.Root className="relative overflow-hidden h-full w-full">
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          className="h-full w-full rounded-[inherit] overflow-y-auto"
          onScroll={() => {
            if (!viewportRef.current) return;
            const viewport = viewportRef.current;
            
            scrollTopRef.current = viewport.scrollTop;

            const threshold = 60; // px from bottom to still count as 'at bottom'
            const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
            setIsAtBottom(distanceFromBottom < threshold);
          }}
        >
          <div
            ref={contentRef}
            className={`flex flex-col w-full ${!isMobile ? `${leftOpen || rightOpen ? 'max-w-[90%]' : 'max-w-[70%]'} mx-auto` : ''} px-2 sm:px-3 md:px-4 transition-[max-width] duration-300 ease-in-out`}
          >
            {messages.map((message, index) => (
              <div
                className="ss-chat__message w-full"
                key={message.id || index}
              >
                <MessageItem
                  message={message}
                />

                {index === messages.length - 1 && (thread?.isFlowRunning ) && (
                  messageHasSomeResponse? 
                    <div className="p-3 min-h-3">
                      <div className="flex space-x-2 p-1">
                        {[0, 300, 600].map((delay) => (
                          <div
                            key={delay}
                            className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  :
                    <div className="rounded-lg border bg-background shadow-md mb-4 group mt-4">
                      <div className="flex items-center justify-between p-3 border-b">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 mt-0.5">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {getInitials('Chatbot')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">Chatbot</span>
                            <span className="text-xs text-muted-foreground">
                              {parseDateTime(new Date(), 'Do MMMM YYYY, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 min-h-3">
                        <div className="flex space-x-2 p-1">
                          {[0, 300, 600].map((delay) => (
                            <div
                              key={delay}
                              className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                <div ref={messagesEndRef} className="h-1" />
              </div>
            ))}
          </div>
        </ScrollAreaPrimitive.Viewport>

        <ScrollAreaPrimitive.Scrollbar
          orientation="vertical"
          className="flex touch-none select-none transition-colors h-full w-2.5 border-l border-l-transparent p-[1px]"
        >
          <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
        </ScrollAreaPrimitive.Scrollbar>

        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </div>
  );
}
