// src/ui/workspaces/WorkspaceSwitcher.vm.ts
import { useNavigate } from '@tanstack/react-router';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useWorkspace, useWorkspaces } from '@/domains/workspaces/queries';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { useSidebar } from '@/shared/ui/shadcn/sidebar';

export function useWorkspaceSwitcherVm() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { workspaceId } = useRouteIds();
  const { data: activeWorkspace } = useWorkspace(workspaceId);
  const { data: workspaces, isLoading } = useWorkspaces(debounced);

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

  const onSelectWorkspace = (id: string) => {
    navigate({ to: '/workspace/$workspaceId', params: { workspaceId: id }, replace: true });
    setOpen(false);
    setSearchTerm('');
    if (isMobile) setOpenMobileLeft(false);
  };

  return {
    // UI state
    open, setOpen,
    searchTerm, setSearchTerm,
    inputRef,

    // data
    activeWorkspace,
    workspaces: workspaces ?? [],
    isLoading,

    // actions
    onSelectWorkspace,
  };
}
