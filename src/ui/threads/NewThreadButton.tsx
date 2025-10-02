// src/ui/threads/NewThreadButton.tsx
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';
import { Button } from '@/shared/ui/shadcn/button';
import { useSidebar } from '@/shared/ui/shadcn/sidebar';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

export default function NewThreadButton() {
  const { isMobile, setOpenMobileLeft } = useSidebar();
  const { workspaceId } = useRouteIds();
  const navigate = useNavigate();

  const handleNewThread = () => {
    const id = crypto.randomUUID();
    if (!workspaceId) return;
    navigate({
      to: '/workspace/$workspaceId/thread/$threadId',
      params: { workspaceId, threadId: id },
    });
    if (isMobile) setOpenMobileLeft(false);
  };

  return (
    <Button onClick={handleNewThread} className="w-full gap-2 text-xs h-9">
      <Plus className="h-3.5 w-3.5" />
      New Thread
    </Button>
  );
}
