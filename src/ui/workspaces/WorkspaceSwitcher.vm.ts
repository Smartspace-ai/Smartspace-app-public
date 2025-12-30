// src/ui/workspaces/WorkspaceSwitcher.vm.ts
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useRef, useState } from 'react';

import { commentsKeys } from '@/domains/comments/queryKeys';
import { messagesKeys } from '@/domains/messages/queryKeys';
import { threadsKeys } from '@/domains/threads/queryKeys';
import type { Workspace } from '@/domains/workspaces/model';
import { useWorkspace, useWorkspaces, workspaceDetailOptions } from '@/domains/workspaces/queries';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { useSidebar } from '@/shared/ui/mui-compat/sidebar';

import { useWorkspaceSubscriptions } from './useWorkspaceSubscriptions';

export function useWorkspaceSwitcherVm() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [pendingWorkspace, setPendingWorkspace] = useState<Pick<Workspace, 'id' | 'name'> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { workspaceId } = useRouteIds();

  useWorkspaceSubscriptions();

  const queryClient = useQueryClient();

  // ⬇ expose loading/error for the single, active workspace
  const {
    data: activeWorkspace,
    isLoading: isActiveLoading,
    isFetching: isActiveFetching,
    error: activeError,
  } = useWorkspace(workspaceId);

  const {
    data: workspaces,
    isLoading,
    isFetching,
    error,
  } = useWorkspaces(debounced);

  const navigate = useNavigate();
  const { isMobile, setOpenMobileLeft } = useSidebar();

  const debouncedSet = useMemo(
    () => debounce((v: string) => setDebounced(v), 300),
    []
  );

  useEffect(() => {
    debouncedSet(searchTerm);
    return () => debouncedSet.cancel();
  }, [searchTerm, debouncedSet]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(id);
  }, [open]);

  const isSwitchingWorkspace = !!pendingWorkspace && pendingWorkspace.id !== workspaceId;
  const selectedWorkspaceId = pendingWorkspace?.id ?? workspaceId;
  const selectedWorkspaceName = pendingWorkspace?.name ?? activeWorkspace?.name;

  useEffect(() => {
    if (!pendingWorkspace) return;
    if (workspaceId === pendingWorkspace.id) setPendingWorkspace(null);
  }, [workspaceId, pendingWorkspace]);

  const onSelectWorkspace = async (ws: Pick<Workspace, 'id' | 'name'>) => {
    const id = ws?.id;
    if (!id) return;
    if (id === workspaceId) {
      setOpen(false);
      setSearchTerm('');
      if (isMobile) setOpenMobileLeft(false);
      return;
    }

    // Optimistically update the "selected" workspace in the dropdown immediately,
    // even if route navigation is still pending.
    setPendingWorkspace({ id, name: ws.name });

    // Seed the active-workspace query cache immediately from the dropdown list item,
    // so header + dropdown reflect the new workspace without waiting for a refetch.
    queryClient.setQueryData(workspaceDetailOptions(id).queryKey, (old: Workspace | undefined) => ({
      ...(old ?? ({} as Workspace)),
      ...(ws as any),
      id,
      name: ws.name,
    }));

    // Immediately clear list/detail caches so the UI shows loading states instead
    // of stale threads/messages/comments from the previous workspace.
    await Promise.all([
      queryClient.cancelQueries({ queryKey: threadsKeys.all }),
      queryClient.cancelQueries({ queryKey: messagesKeys.all }),
      queryClient.cancelQueries({ queryKey: commentsKeys.all }),
    ]);

    queryClient.removeQueries({ queryKey: threadsKeys.all });
    queryClient.removeQueries({ queryKey: messagesKeys.all });
    queryClient.removeQueries({ queryKey: commentsKeys.all });

    // Compatibility: some older invalidations used a raw comments key
    queryClient.removeQueries({ queryKey: ['comments'] });

    navigate({ to: '/workspace/$workspaceId', params: { workspaceId: id }, replace: true });
    setOpen(false);
    setSearchTerm('');
    if (isMobile) setOpenMobileLeft(false);
  };

  return {
    // UI state
    open,
    setOpen,
    searchTerm,
    setSearchTerm,
    inputRef,

    // data
    activeWorkspace,
    activeWorkspaceId: selectedWorkspaceId,
    activeWorkspaceName: selectedWorkspaceName,
    switchingWorkspace: isSwitchingWorkspace,
    activeLoading: isActiveLoading || isActiveFetching,
    activeError,
    workspaces: workspaces ?? [],
    isLoading: isLoading || isFetching,
    error,

    // actions
    onSelectWorkspace,
  };
}
