// src/ui/threads/NewThreadButton.tsx
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { Button } from '@/shared/ui/mui-compat/button';
import { useSidebar } from '@/shared/ui/mui-compat/sidebar';

export default function NewThreadButton() {
  const { isMobile, setOpenMobileLeft } = useSidebar();
  const { workspaceId } = useRouteIds();
  const navigate = useNavigate();

  const handleNewThread = () => {
    if (!workspaceId) return;
    navigate({
      to: '/workspace/$workspaceId/thread/new',
      params: { workspaceId },
    });
    if (isMobile) setOpenMobileLeft(false);
  };

  return (
    <Button
      onClick={handleNewThread}
      className="w-full gap-2 text-xs h-9"
      disabled={!workspaceId}
    >
      <Plus className="h-3.5 w-3.5" />
      New Thread
    </Button>
  );
}
