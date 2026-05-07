// src/ui/workspaces/WorkspaceSwitcher.vm.ts
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import debounce from 'lodash.debounce';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { useWorkspaces } from '@/domains/workspaces';

import { useSidebar } from '@/shared/ui/mui-compat/sidebar';

import type { Workspace } from '@smartspace/chat-ui';
import { useWorkspace, workspaceKeys } from '@smartspace/chat-ui';

export function useWorkspaceSwitcherVm() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [pendingWorkspace, setPendingWorkspace] = useState<Pick<
    Workspace,
    'id' | 'name' | 'tags'
  > | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { workspaceId } = useRouteIds();

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

  const isSwitchingWorkspace =
    !!pendingWorkspace && pendingWorkspace.id !== workspaceId;
  const selectedWorkspaceId = pendingWorkspace?.id ?? workspaceId;
  const selectedWorkspaceName = pendingWorkspace?.name ?? activeWorkspace?.name;
  const selectedWorkspaceTags = pendingWorkspace?.tags ?? activeWorkspace?.tags;

  useEffect(() => {
    if (!pendingWorkspace) return;
    if (workspaceId === pendingWorkspace.id) setPendingWorkspace(null);
  }, [workspaceId, pendingWorkspace]);

  const onSelectWorkspace = async (
    ws: Pick<Workspace, 'id' | 'name' | 'tags'>
  ) => {
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
    setPendingWorkspace({ id, name: ws.name, tags: ws.tags ?? [] });

    // Seed the active-workspace query cache immediately from the dropdown list item,
    // so header + dropdown reflect the new workspace without waiting for a refetch.
    queryClient.setQueryData(
      workspaceKeys.byId(id),
      (old: Workspace | undefined) => {
        const base: Partial<Workspace> = old ?? {};
        return {
          ...base,
          ...ws,
          id,
          name: ws.name,
          tags: ws.tags ?? old?.tags ?? [],
        } as Workspace;
      }
    );

    // The seeded data above is partial (no `variables`, etc.).  Mark it stale so
    // the layout loader's `ensureQueryData` refetches the full workspace from the API.
    queryClient.invalidateQueries({
      queryKey: workspaceKeys.byId(id),
    });

    navigate({
      to: '/workspace/$workspaceId',
      params: { workspaceId: id },
      replace: true,
    });
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
    activeWorkspaceTags: selectedWorkspaceTags,
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
