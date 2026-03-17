// src/ui/threads/NewThreadButton.tsx
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { ensureDraftThread, removeDraftThread } from '@/domains/threads';

import { Button } from '@/shared/ui/mui-compat/button';
import { useSidebar } from '@/shared/ui/mui-compat/sidebar';

export default function NewThreadButton() {
  const { isMobile, setOpenMobileLeft } = useSidebar();
  const { workspaceId } = useRouteIds();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewThread = () => {
    if (!workspaceId || isCreating) return;
    setIsCreating(true);
    let draftId: string | null = null;

    try {
      const result = ensureDraftThread(workspaceId, queryClient);
      draftId = result.draftId;

      navigate({
        to: '/workspace/$workspaceId/thread/$threadId',
        params: { workspaceId, threadId: draftId },
      });
      if (isMobile) setOpenMobileLeft(false);
    } catch (e) {
      console.error('Failed to create thread', e);
      if (draftId) {
        removeDraftThread(workspaceId, draftId, queryClient);
        navigate({
          to: '/workspace/$workspaceId',
          params: { workspaceId },
          replace: true,
        });
      }
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
      <Plus className="h-3.5 w-3.5" />
      New Thread
    </Button>
  );
}
