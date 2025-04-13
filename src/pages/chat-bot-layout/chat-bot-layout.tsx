// ChatBotLayout.tsx
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

export default function ChatBotLayout() {
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const navigate = useNavigate();
  const { workspaces, isLoading } = useWorkspaces();

  useEffect(() => {
    if (!workspaceId && !isLoading && workspaces.length > 0) {
      // Redirect to the first workspace if none is in the URL.
      navigate(`/workspace/${workspaces[0].id}`, { replace: true });
    }
  }, [workspaceId, isLoading, workspaces, navigate]);

  return <Outlet />;
}
