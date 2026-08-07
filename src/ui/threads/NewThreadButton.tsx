// src/ui/threads/NewThreadButton.tsx
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { ensureDraftThread, removeDraftThread } from '@/domains/threads';

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
    // `chat-new-thread` carries the whole look (outlined, teal glyph, hover
    // tint) from the theme layer, so this is a plain button rather than the
    // filled `Button` primitive.
    <button
      type="button"
      onClick={handleNewThread}
      className="chat-new-thread disabled:cursor-not-allowed disabled:opacity-50"
      disabled={!workspaceId || isCreating}
    >
      <Plus className="h-4 w-4" />
      New Thread
    </button>
  );
}
