import { isCancelledError } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { z } from 'zod';

import { defaultChatService } from '@/platform/chat/defaultChatService';
import { isNotFoundError } from '@/platform/envelopes';

import { ensureDraftThread, threadsListOptions } from '@/domains/threads';

import { ThreadRenameModal } from '@/ui/threads/ThreadRenameModal';

import { useSidebar } from '@/shared/ui/mui-compat/sidebar';

import { threadDetailOptions, useThread } from '@smartspace/chat-ui';

const threadRouteSearchSchema = z.object({
  modal: z.enum(['rename', 'delete']).optional(),
  targetId: z.string().optional(),
  panel: z.enum(['comments']).optional(),
  focusMessageId: z.string().optional(),
});

export type ThreadRouteSearch = z.infer<typeof threadRouteSearchSchema>;

// routes/_protected/workspace/$workspaceId/thread/$threadId.tsx
export const Route = createFileRoute(
  '/_protected/workspace/$workspaceId/_layout/thread/$threadId'
)({
  validateSearch: (search): ThreadRouteSearch =>
    threadRouteSearchSchema.parse(search),
  pendingMs: 0,
  loader: async ({ params, context }) => {
    try {
      return await context.queryClient.ensureQueryData(
        threadDetailOptions({
          service: defaultChatService,
          workspaceId: params.workspaceId,
          threadId: params.threadId,
        })
      );
    } catch (e: unknown) {
      // A cancelled fetch means "unknown", not "gone" — pin/rename/delete's
      // onMutate all cancel the shared threadsKeys.details() query space, not
      // just a thread actually being deleted. Treating it as not-found and
      // redirecting (with replace: true, undoable by Back) could bounce the
      // user away from a perfectly good thread they just clicked into. The
      // loader's return value isn't consumed — ThreadRouteComponent and
      // MessageList read useThread()/useMessages() directly — so returning
      // null here just lets those hooks' own queries resolve normally.
      if (isCancelledError(e)) return null;

      // If a thread can't be loaded, fall back to the first thread — but ONLY if
      // it's a DIFFERENT thread. A thread can appear in the list while its detail
      // endpoint 404s (data inconsistency); "redirect to first" then resolves
      // back to the same id → an infinite redirect loop that never commits, so
      // the boot splash stays up forever and requests fire endlessly. When there
      // is no different thread to show, commit the route with no thread instead
      // of looping (the component renders an empty state and the splash lifts).
      if (!isNotFoundError(e)) throw e;

      let list;
      try {
        list = await context.queryClient.ensureQueryData(
          threadsListOptions(params.workspaceId, { take: 1, skip: 0 })
        );
      } catch (listError: unknown) {
        // Same reasoning as above: an unrelated mutation can cancel this
        // list refetch too (threadsKeys.lists()) mid-recovery. That isn't
        // evidence the workspace is empty, so don't act on it.
        if (isCancelledError(listError)) return null;
        throw listError;
      }
      const first = list.data[0];

      if (first?.id && first.id !== params.threadId) {
        throw redirect({
          to: '/workspace/$workspaceId/thread/$threadId',
          params: { workspaceId: params.workspaceId, threadId: first.id },
          replace: true,
        });
      }

      if (!first) {
        // No threads left at all — land on a draft instead of committing the
        // route with a dead thread id (which paints "failed to load" errors).
        const { draftId } = ensureDraftThread(
          params.workspaceId,
          context.queryClient
        );
        throw redirect({
          to: '/workspace/$workspaceId/thread/$threadId',
          params: { workspaceId: params.workspaceId, threadId: draftId },
          replace: true,
        });
      }

      return null;
    }
  },
  component: ThreadRouteComponent,
});

function ThreadRouteComponent() {
  const { workspaceId, threadId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { setRightOpen, rightOpen } = useSidebar();
  const prevRightOpenRef = useRef(rightOpen);
  const { data: thread } = useThread({ workspaceId, threadId });

  // Chained across mounts: thread A's cleanup restores thread B's title, B's
  // restores the original — stays correct through repeated navigation
  // without hardcoding a default (whitelabel-safe).
  useEffect(() => {
    if (!thread?.name) return;
    const previous = document.title;
    document.title = thread.name;
    return () => {
      document.title = previous;
    };
  }, [thread?.name]);

  const isRenameOpen =
    search.modal === 'rename' && search.targetId === threadId && !!thread;

  useEffect(() => {
    if (search.panel === 'comments') setRightOpen(true);
  }, [search.panel, setRightOpen]);

  useEffect(() => {
    if (prevRightOpenRef.current && !rightOpen && search.panel === 'comments') {
      navigate({
        to: '.',
        search: (prev: ThreadRouteSearch) => ({
          ...prev,
          panel: undefined,
          focusMessageId: undefined,
        }),
        replace: true,
      });
    }
    prevRightOpenRef.current = rightOpen;
  }, [rightOpen, search.panel, navigate]);

  const closeRenameModal = () => {
    navigate({
      to: '.',
      search: (prev: ThreadRouteSearch) => ({
        ...prev,
        modal: undefined,
        targetId: undefined,
      }),
      replace: true,
    });
  };

  if (!thread) return null;

  return (
    <ThreadRenameModal
      isOpen={isRenameOpen}
      onClose={closeRenameModal}
      thread={thread}
    />
  );
}
