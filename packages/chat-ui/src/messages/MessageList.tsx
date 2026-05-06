import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useChatContext } from '@/platform/chat';

import { useMessages } from '@/domains/messages';
import { useThread, useThreadIsRunning } from '@/domains/threads/queries';
import { useWorkspace } from '@/domains/workspaces/queries';

import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { MessageMarkdown } from '@/shared/markdown/MessageMarkdown';
import { Skeleton } from '@/shared/mui-compat/skeleton';

import { getBackgroundGradientClasses } from '@/theme/tag-styles';

import { MessageItem } from './MessageItem';

export type MessageListProps = {
  /**
   * Apply a solid-base + tag-driven gradient to the message body. Set this
   * when embedding inside a host whose default page background can show
   * through and skew the perceived chat color (e.g. Microsoft Teams web
   * client). Defaults to false — the standard browser app doesn't need it.
   */
  applyHostBackgroundOverride?: boolean;
  /**
   * Use the wider desktop max-width (90% instead of 70%). Set this when the
   * chat is rendered in a layout where horizontal room is constrained by
   * other panels (e.g. a sidebar is open beside it). Standalone fork passes
   * `leftOpen || rightOpen` from `useSidebar()`; the sandbox doesn't have
   * sidebars, so it omits the prop and gets the natural 70% width.
   */
  expandedLayout?: boolean;
  /**
   * Set to `true` while the host is mid-redirect from a "no thread selected"
   * route to the first thread of a workspace — the message list shows a
   * loading skeleton instead of the empty-state during that brief window so
   * users don't see a "No messages yet" flash.
   *
   * Standalone web fork passes this from `useMatch('/.../_layout/')` to
   * detect the workspace-index route specifically. The sandbox/admin doesn't
   * have multi-thread navigation, so it omits the prop entirely (defaults
   * `false` — no router coupling).
   */
  isChoosingThread?: boolean;
};

export function MessageList({
  applyHostBackgroundOverride = false,
  expandedLayout = false,
  isChoosingThread = false,
}: MessageListProps = {}) {
  const { workspaceId, threadId } = useChatContext();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollTopRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  const hasInitialScrollRef = useRef<boolean>(false);
  const isMobile = useIsMobile();

  const { data: activeWorkspace } = useWorkspace(workspaceId);

  const [isAtBottom, setIsAtBottom] = useState(true);

  const {
    data: thread,
    isPending: threadPending,
    isFetching: threadFetching,
    error: threadError,
  } = useThread({ workspaceId, threadId });
  const isRunning = useThreadIsRunning(workspaceId, threadId);
  const {
    data: messages,
    isPending: messagesPending,
    isFetching: messagesFetching,
    error: messagesError,
  } = useMessages(threadId);

  // When the host page can bleed a dark background through (e.g. Teams web),
  // render our own solid base + tag-driven gradient on the message body so
  // the perceived chat color matches the standalone web UI. Driven by the
  // `applyHostBackgroundOverride` prop — the chat tree itself stays
  // host-agnostic.
  const hostBg = useMemo(() => {
    if (!applyHostBackgroundOverride) return '';
    const grad = getBackgroundGradientClasses({
      tags: activeWorkspace?.tags,
      name: activeWorkspace?.name,
    });
    return `bg-white bg-gradient-to-b from-white from-10% ${grad} via-40% to-100%`;
  }, [
    applyHostBackgroundOverride,
    activeWorkspace?.tags,
    activeWorkspace?.name,
  ]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maxScrollTop = Math.max(
      0,
      viewport.scrollHeight - viewport.clientHeight
    );
    viewport.scrollTo({ top: maxScrollTop, behavior });
  }, []);

  // Initial: if we have messages, start at the bottom.
  useEffect(() => {
    if (hasInitialScrollRef.current) return;
    if (!viewportRef.current) return;
    if (!messages?.length) return;
    hasInitialScrollRef.current = true;
    requestAnimationFrame(() => scrollToBottom('auto'));
  }, [messages?.length, scrollToBottom]);

  // When new messages arrive and user is already at bottom, keep them pinned to bottom.
  useEffect(() => {
    const count = messages?.length ?? 0;
    const prev = prevMessageCountRef.current;
    prevMessageCountRef.current = count;

    if (!viewportRef.current) return;
    if (!count) return;

    // Only auto-scroll if user hasn't scrolled up.
    if (!isAtBottom) return;

    // Smooth for incremental growth, auto for initial/large jumps.
    const behavior: ScrollBehavior =
      prev > 0 && count > prev ? 'smooth' : 'auto';
    requestAnimationFrame(() => scrollToBottom(behavior));
  }, [messages?.length, isAtBottom, scrollToBottom]);

  // When the thread starts "running" (typing indicator appears) but message count doesn't change,
  // still ensure we reveal the loading dots if the user is at the bottom.
  useEffect(() => {
    if (!isRunning) return;
    if (!isAtBottom) return;
    requestAnimationFrame(() => scrollToBottom('smooth'));
  }, [isRunning, isAtBottom, scrollToBottom]);

  // Also keep pinned when content height changes (streaming tokens, images, typing indicator).
  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      if (!isAtBottom) return;
      scrollToBottom('auto');
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [isAtBottom, scrollToBottom]);

  const safeMessages = messages ?? [];

  // Avoid flicker: if we already have data, keep rendering it while refetching.
  // `isChoosingThread` is opt-in via prop — see MessageListProps for usage.
  const isLoading =
    isChoosingThread ||
    ((threadPending || threadFetching) && !thread) ||
    ((messagesPending || messagesFetching) && messages === undefined);

  if (isLoading) {
    return (
      <div
        className={`ss-chat__body flex-shrink-10 flex-1 overflow-y-auto ${hostBg}`}
        data-ss-layer="message-list"
      >
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
              <span className="text-sm font-medium">
                Failed to load messages
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (safeMessages.length === 0) {
    return (
      <div className="flex overflow-auto flex-shrink-10 flex-col p-8 text-center">
        <h3 className="text-lg font-medium mb-2">
          {activeWorkspace?.name ?? 'No messages yet'}
        </h3>
        {activeWorkspace?.firstPrompt && (
          <div className="max-w-3xl mx-auto p-4">
            <MessageMarkdown value={activeWorkspace.firstPrompt} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`ss-chat__body ${hostBg}`}
      data-ss-layer="message-list"
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <ScrollAreaPrimitive.Root
        data-ss-layer="scroll-root"
        className="relative overflow-hidden h-full w-full"
      >
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          data-ss-layer="scroll-viewport"
          className="h-full w-full rounded-[inherit] overflow-y-auto"
          onScroll={() => {
            if (!viewportRef.current) return;
            const viewport = viewportRef.current;

            scrollTopRef.current = viewport.scrollTop;

            const threshold = 60; // px from bottom to still count as 'at bottom'
            const distanceFromBottom =
              viewport.scrollHeight -
              viewport.scrollTop -
              viewport.clientHeight;
            setIsAtBottom(distanceFromBottom < threshold);
          }}
        >
          <div
            ref={contentRef}
            className={`flex flex-col w-full ${
              !isMobile
                ? `${expandedLayout ? 'max-w-[90%]' : 'max-w-[70%]'} mx-auto`
                : ''
            } px-2 sm:px-3 md:px-4 transition-[max-width] duration-300 ease-in-out`}
          >
            {safeMessages.map((message, index) => {
              const isLastMessage = index === safeMessages.length - 1;
              const isLive = isLastMessage && isRunning;
              return (
                <div
                  className="ss-chat__message w-full"
                  key={message.id || index}
                >
                  <MessageItem message={message} isLive={isLive} />

                  {isLastMessage && isRunning && (
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
                  )}

                  <div ref={messagesEndRef} className="h-1" />
                </div>
              );
            })}
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
