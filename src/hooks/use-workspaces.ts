import { fetchWorkspaces } from '@/apis/workspaces';
import { useSmartSpace } from '@/contexts/smartspace-context';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Workspace } from '../models/workspace';
import { useWorkspaceThreads } from './use-workspace-threads';

export function useWorkspaces() {
  const {
    activeWorkspace,
    setActiveWorkspace,
    sortOrder,
  } = useSmartSpace();
  const navigate = useNavigate();
  const { workspaceId, threadId } = useParams();
  const [searchParams] = useSearchParams();
  const hasSearchParams = searchParams.toString().length > 0;

  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
  });

  const { threads } = useWorkspaceThreads();

  useEffect(() => {
    if (workspaces.length === 0 || activeWorkspace) return;

    const matchedWorkspace = workspaces.find((w) => w.id === workspaceId);
    const fallbackWorkspace = workspaces[0];

    const selectedWorkspace = matchedWorkspace || fallbackWorkspace;
    setActiveWorkspace(selectedWorkspace);

    if (!matchedWorkspace) {
      navigate(`/workspace/${selectedWorkspace.id}`);
    }
  }, [workspaces, workspaceId, activeWorkspace, setActiveWorkspace, navigate]);

  // Set thread from URL if possible
  useEffect(() => {
    if (
      !activeWorkspace ||
      !threadId ||
      !threads ||
      threads.length === 0 ||
      !hasSearchParams
    )
      return;

    const matchedThread = threads.find((t) => t.id === threadId);

    if (matchedThread) {
      navigate(`/workspace/${workspaceId}/thread/${matchedThread.id}`);
    } else {
      navigate(`/workspace/${workspaceId}/thread/${threads[0].id}`);
    }
  }, [
    threads,
    threadId,
    activeWorkspace,
    sortOrder,
    hasSearchParams,
  ]);

  const handleWorkspaceChange = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    navigate(`/workspace/${workspace.id}`);
  };

  return {
    workspaces,
    activeWorkspace,
    isLoading,
    error,
    refetch,
    handleWorkspaceChange,
  };
}
