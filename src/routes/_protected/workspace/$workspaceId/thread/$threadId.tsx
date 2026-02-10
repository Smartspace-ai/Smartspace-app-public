import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { z } from 'zod';

import {
  threadDetailOptions,
  threadsListOptions,
  useThread,
} from '@/domains/threads/queries';

import { PendingThreadsProvider } from '@/ui/threads/PendingThreadsContext';
import { ThreadRenameModal } from '@/ui/threads/ThreadRenameModal';

import ChatBotPage from '@/pages/WorkspaceThreadPage/chat';

import { useSidebar } from '@/shared/ui/mui-compat/sidebar';

const threadRouteSearchSchema = z.object({
  modal: z.enum(['rename', 'delete']).optional(),
  targetId: z.string().optional(),
  panel: z.enum(['comments']).optional(),
  focusMessageId: z.string().optional(),
});

export type ThreadRouteSearch = z.infer<typeof threadRouteSearchSchema>;

// routes/_protected/workspace/$workspaceId/thread/$threadId.tsx
export const Route = createFileRoute(
  '/_protected/workspace/$workspaceId/thread/$threadId'
)({
  validateSearch: (search): ThreadRouteSearch =>
    threadRouteSearchSchema.parse(search),
  pendingMs: 0,
  loader: async ({ params, context }) => {
    try {
      return await context.queryClient.ensureQueryData(
        threadDetailOptions({
          workspaceId: params.workspaceId,
          threadId: params.threadId,
        })
      );
    } catch (e: unknown) {
      // If user deep-links to a random GUID that doesn't exist, redirect to the first thread
      // (same behavior as /workspace/$workspaceId/ without a threadId).
      const err =
        e && typeof e === 'object' ? (e as Record<string, unknown>) : null;
      if (err?.type !== 'NotFound') throw e;

      const list = await context.queryClient.ensureQueryData(
        threadsListOptions(params.workspaceId, { take: 1, skip: 0 })
      );
      const first = Array.isArray(list)
        ? (list[0] as { id?: string })
        : (list as { data?: { id?: string }[] } | undefined)?.data?.[0];

      if (first?.id) {
        throw redirect({
          to: '/workspace/$workspaceId/thread/$threadId',
          params: { workspaceId: params.workspaceId, threadId: first.id },
          replace: true,
        });
      }

      throw redirect({
        to: '/workspace/$workspaceId',
        params: { workspaceId: params.workspaceId },
        replace: true,
      });
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
        search: (prev) => ({
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
      search: (prev) => ({
        ...prev,
        modal: undefined,
        targetId: undefined,
      }),
      replace: true,
    });
  };

  return (
    <PendingThreadsProvider>
      <ChatBotPage workspaceId={workspaceId} threadId={threadId} />
      {thread && (
        <ThreadRenameModal
          isOpen={isRenameOpen}
          onClose={closeRenameModal}
          thread={thread}
        />
      )}
    </PendingThreadsProvider>
  );
}
