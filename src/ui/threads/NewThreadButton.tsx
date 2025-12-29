// src/ui/threads/NewThreadButton.tsx
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { threadsKeys } from '@/domains/threads/queryKeys';
import { createThread } from '@/domains/threads/service';
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { Button } from '@/shared/ui/mui-compat/button';
import { useSidebar } from '@/shared/ui/mui-compat/sidebar';

export default function NewThreadButton() {
  const { isMobile, setOpenMobileLeft } = useSidebar();
  const { workspaceId } = useRouteIds();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewThread = async () => {
    if (!workspaceId || isCreating) return;
    setIsCreating(true);
    try {
      const thread = await createThread('New Thread', workspaceId);

      // Prime thread detail cache so the route loader doesn't immediately re-fetch
      queryClient.setQueryData(threadsKeys.detail(workspaceId, thread.id), thread);
      // Refresh thread list so the new thread shows up in the sidebar list
      queryClient.invalidateQueries({ queryKey: threadsKeys.lists() });

      navigate({
        to: '/workspace/$workspaceId/thread/$threadId',
        params: { workspaceId, threadId: thread.id },
      });
      if (isMobile) setOpenMobileLeft(false);
    } catch (e) {
      console.error('Failed to create thread', e);
      toast.error('Failed to create thread. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleNewThread}
      className="w-full gap-2 text-xs h-9"
      disabled={!workspaceId || isCreating}
    >
      {isCreating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Plus className="h-3.5 w-3.5" />
      )}
      {isCreating ? 'Creating…' : 'New Thread'}
    </Button>
  );
}
