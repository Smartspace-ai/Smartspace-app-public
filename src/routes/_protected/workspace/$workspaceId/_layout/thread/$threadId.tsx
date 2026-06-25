import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { z } from 'zod';

import { defaultChatService } from '@/platform/chat/defaultChatService';
import { isNotFoundError } from '@/platform/envelopes';

import { threadsListOptions } from '@/domains/threads';

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
      // If a thread can't be loaded, fall back to the first thread — but ONLY if
      // it's a DIFFERENT thread. A thread can appear in the list while its detail
      // endpoint 404s (data inconsistency); "redirect to first" then resolves
      // back to the same id → an infinite redirect loop that never commits, so
      // the boot splash stays up forever and requests fire endlessly. When there
      // is no different thread to show, commit the route with no thread instead
      // of looping (the component renders an empty state and the splash lifts).
      if (!isNotFoundError(e)) throw e;

      const list = await context.queryClient.ensureQueryData(
        threadsListOptions(params.workspaceId, { take: 1, skip: 0 })
      );
      const first = list.data[0];

      if (first?.id && first.id !== params.threadId) {
        throw redirect({
          to: '/workspace/$workspaceId/thread/$threadId',
          params: { workspaceId: params.workspaceId, threadId: first.id },
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
