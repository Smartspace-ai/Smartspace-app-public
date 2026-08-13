import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useChatContext } from '@/platform/chat';

import { useMessages } from '@/domains/messages';
import { useThread, useThreadIsRunning } from '@/domains/threads/queries';
import { useWorkspace } from '@/domains/workspaces/queries';

import { MessageMarkdown } from '@/shared/markdown/MessageMarkdown';
import { Skeleton } from '@/shared/mui-compat/skeleton';

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
   * @deprecated No-op. The message column is centred at a fixed reading width
   * (`.chat-column`) at every size, so there is no sidebar-dependent max-width
   * to toggle. Still accepted so existing callers keep compiling.
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
  isChoosingThread = false,
}: MessageListProps = {}) {
  const { workspaceId, threadId } = useChatContext();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollTopRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  const hasInitialScrollRef = useRef<boolean>(false);
  // Per-thread high-water mark of "have we ever rendered messages?". Once
  // true, the loading / error / empty fallback branches stop returning a
  // different DOM tree — instead we fall through to the ScrollArea with
  // whatever's currently in cache (possibly empty for a frame). This both
  // hides the transient "Failed to load messages" flash that surfaces from
  // SSE/SignalR/mutation cache races at flow completion, and preserves the
  // viewport's scrollTop across those blips so the user doesn't get
  // bounced back to the top of the conversation. Reset on threadId change
  // so a brand-new draft thread still gets its welcome screen on first
  // paint.
  const everHadMessagesRef = useRef<{ threadId: string; had: boolean }>({
    threadId: '',
    had: false,
  });

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
  const hostBg = applyHostBackgroundOverride ? 'chat-main' : '';

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

  // Track per-thread whether we've ever rendered ≥1 message. Once true, fall
  // through to the ScrollArea below for the rest of the thread's lifetime so
  // transient cache states (refetch error, momentarily empty cache from a
  // stale write at flow completion) don't unmount the viewport and bounce
  // the user back to the top.
  if (everHadMessagesRef.current.threadId !== threadId) {
    everHadMessagesRef.current = { threadId, had: safeMessages.length > 0 };
  } else if (safeMessages.length > 0) {
    everHadMessagesRef.current.had = true;
  }
  const hadMessagesBefore = everHadMessagesRef.current.had;

  // Avoid flicker: if we already have data, keep rendering it while refetching.
  // `isChoosingThread` is opt-in via prop — see MessageListProps for usage.
  const isLoading =
    isChoosingThread ||
    ((threadPending || threadFetching) && !thread) ||
    ((messagesPending || messagesFetching) && messages === undefined);

  if (isLoading && !hadMessagesBefore) {
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
  if ((threadError || messagesError) && !hadMessagesBefore) {
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

  if (safeMessages.length === 0 && !hadMessagesBefore) {
    return (
      // A new thread opens the way the design does: the greeting and the
      // composer travel together as one narrower block centred in the canvas.
      // `mt-auto` here and `mb-auto` on the composer split the free space above
      // and below the pair; neither element claims `flex-1`.
      <div
        // `min-h-0` rather than `shrink-0`: a long `firstPrompt` should scroll
        // inside this block instead of pushing the composer off the canvas.
        className={`ss-chat__body mt-auto flex min-h-0 flex-col items-center overflow-auto px-4 ${hostBg}`}
        data-ss-layer="message-list"
      >
        {/* 24px below this block plus the composer's own 8px of top padding is
            the 32px the design leaves between the greeting and the card. */}
        <div className="mx-auto mb-6 w-full max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            What&rsquo;s on the agenda today?
          </h2>
          {activeWorkspace?.firstPrompt && (
            <div className="chat-prose mt-3 text-center">
              <MessageMarkdown value={activeWorkspace.firstPrompt} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ss-chat__body chat-scroll ${hostBg}`}
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
            className="chat-column chat-turns flex w-full flex-col px-4 py-6"
          >
            {safeMessages.map((message, index) => {
              const isLastMessage = index === safeMessages.length - 1;
              const isLive = isLastMessage && isRunning;
              return (
                <div
                  className="ss-chat__message w-full"
                  key={message.id || index}
                >
                  {/* The thinking indicator lives inside MessageItem — it is
                      the same section tool statuses render into, and only that
                      component knows whether the answer has started printing.
                      `isLive` is the gate. */}
                  <MessageItem message={message} isLive={isLive} />

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
