import { fetchWorkspaces } from '@/apis/workspaces';
import { useSmartSpaceChat } from '@/contexts/smartspace-context';
import { sortThreads } from '@/utils/sort-threads';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Workspace } from '../models/workspace';
import { useWorkspaceThreads } from './use-workspace-threads';

export function useWorkspaces() {
  const {
    activeWorkspace,
    activeThread,
    setActiveWorkspace,
    setActiveThread,
    sortOrder,
  } = useSmartSpaceChat();

  const navigate = useNavigate();
  const { workspaceId, threadId } = useParams();

  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
  });

  const { threads, handleThreadChange } = useWorkspaceThreads();

  useEffect(() => {
    if (workspaces.length === 0 || activeWorkspace) return;

    const matchedWorkspace = workspaces.find((w) => w.id === workspaceId);
    const fallbackWorkspace = workspaces[0];

    const selectedWorkspace = matchedWorkspace || fallbackWorkspace;
    setActiveWorkspace(selectedWorkspace);

    if (!matchedWorkspace) {
      navigate(`/workspace/${selectedWorkspace.id}`, { replace: true });
    }
  }, [workspaces, workspaceId, activeWorkspace, setActiveWorkspace, navigate]);

  // Set thread from URL if possible
  useEffect(() => {
    if (!activeWorkspace || !threadId || threads.length === 0 || !!activeThread)
      return;

    const sorted = sortThreads(threads, sortOrder);
    const matchedThread = sorted.find((t) => t.id === threadId);

    if (matchedThread) {
      handleThreadChange(matchedThread);
    } else {
      handleThreadChange(sorted[0]);
    }
  }, [threads, threadId, activeWorkspace, sortOrder, handleThreadChange]);

  const handleWorkspaceChange = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    setActiveThread(null);
    navigate(`/workspace/${workspace.id}`, { replace: true });
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
