import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { useMatch } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { isInTeams } from '@/platform/auth/msalConfig';

import { MessageValueType, useMessages } from '@/domains/messages';
import { useThread } from '@/domains/threads/queries';
import { useWorkspace } from '@/domains/workspaces/queries';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { Avatar, AvatarFallback } from '@/shared/ui/mui-compat/avatar';
import { useSidebar } from '@/shared/ui/mui-compat/sidebar';
import { Skeleton } from '@/shared/ui/mui-compat/skeleton';
import { getInitials } from '@/shared/utils/initials';
import { parseDateTime } from '@/shared/utils/parseDateTime';

import { getChatbotName } from '@/theme/public-config';
import { getBackgroundGradientClasses } from '@/theme/tag-styles';

import { MessageItem } from './MessageItem';





export function MessageList() {
    const { workspaceId, threadId } = useRouteIds();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollTopRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  const { data: activeWorkspace } = useWorkspace(workspaceId);
  const workspaceIndexMatch = useMatch({ from: '/_protected/workspace/$workspaceId/', shouldThrow: false });


  const [isAtBottom, setIsAtBottom] = useState(true);

  const { data: thread, isPending: threadPending, isFetching: threadFetching, error: threadError } = useThread({ workspaceId, threadId })
  const { data: messages, isPending: messagesPending, isFetching: messagesFetching, error: messagesError } = useMessages(threadId)


  const { leftOpen, rightOpen } = useSidebar();
  const chatbotName = getChatbotName(activeWorkspace?.name);
  const inTeams = isInTeams();

  // In Teams web, the host can cause the underlying page/background to look dark.
  // To make it match the web UI, we render our own background on the message list area:
  // default primary gradient, or tag-driven gradient when a workspace has tags.
  const teamsBg = useMemo(() => {
    if (!inTeams) return '';
    const grad = getBackgroundGradientClasses({ tags: activeWorkspace?.tags, name: activeWorkspace?.name });
    // In Teams web, set an explicit solid base color first, then layer the gradient on top.
    // This prevents any dark host/iframe background from influencing the perceived color.
    return `bg-white bg-gradient-to-b from-white from-10% ${grad} via-40% to-100%`;
  }, [inTeams, activeWorkspace?.tags, activeWorkspace?.name]);

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
  }, [messages, messages?.length, isAtBottom, threadPending, threadFetching, messagesPending, messagesFetching, threadError, messagesError]);

  // When switching workspaces, we briefly land on /workspace/$workspaceId/ (no threadId) while the route loader
  // redirects to the first thread. During that transition we should show a loading skeleton, not "No messages yet".
  const isChoosingThread = !!workspaceId && !threadId && !!workspaceIndexMatch;
  // Avoid flicker: if we already have data, keep rendering it while refetching.
  const isLoading =
    isChoosingThread ||
    ((threadPending || threadFetching) && !thread) ||
    ((messagesPending || messagesFetching) && messages === undefined);

  if (isLoading) {
    return (
      <div className={`ss-chat__body flex-shrink-10 flex-1 overflow-y-auto ${teamsBg}`} data-ss-layer="message-list">
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

  const safeMessages = messages ?? [];

  if (safeMessages.length === 0) {
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

  const messageHasSomeResponse =
    safeMessages.length > 0 &&
    safeMessages[safeMessages.length - 1]?.values?.some(v => v.type === MessageValueType.OUTPUT)

  return (
    <div className={`ss-chat__body ${teamsBg}`} data-ss-layer="message-list" style={{ flex: 1, minHeight: 0, minWidth: 0, height: '100%', width: '100%', overflow: 'hidden' }}>
      <ScrollAreaPrimitive.Root data-ss-layer="scroll-root" className="relative overflow-hidden h-full w-full">
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          data-ss-layer="scroll-viewport"
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
            {safeMessages.map((message, index) => (
              <div
                className="ss-chat__message w-full"
                key={message.id || index}
              >
                <MessageItem
                  message={message}
                />

                {index === safeMessages.length - 1 && (thread?.isFlowRunning ) && (
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
                            <AvatarFallback className="text-xs">
                              {getInitials('Chatbot')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{chatbotName}</span>
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

