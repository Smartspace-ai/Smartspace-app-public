// src/ui/workspaces/WorkspaceSwitcher.tsx
import Skeleton from '@mui/material/Skeleton';
import { ChevronDown } from 'lucide-react';

import { CircleInitials } from '@/shared/components/circle-initials';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/mui-compat/popover';

import { Workspace } from '@smartspace/chat-ui';

import { useWorkspaceSwitcherVm } from './WorkspaceSwitcher.vm';

export function WorkspaceSwitcher() {
  const vm = useWorkspaceSwitcherVm();

  const buttonLabel = vm.activeError
    ? 'Failed to load workspace'
    : vm.activeWorkspaceName ?? vm.activeWorkspace?.name
    ? vm.activeWorkspaceName ?? vm.activeWorkspace?.name ?? '—'
    : vm.activeLoading
    ? 'Loading workspace…'
    : '—';

  return (
    <div className="px-5 pb-4">
      <Popover open={vm.open} onOpenChange={vm.setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={() => vm.setOpen((prev) => !prev)}
            aria-expanded={vm.open}
            aria-haspopup="listbox"
            aria-busy={vm.activeLoading}
            title={
              vm.activeError ? 'Active workspace failed to load' : undefined
            }
            className={`flex w-full items-center justify-between overflow-hidden rounded-md border px-3 py-2.5 text-foreground transition-colors hover:border-primary/40 ${
              vm.activeError
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-border'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5 overflow-hidden">
              <CircleInitials
                className="h-7 w-7 min-w-[28px] text-[10px] shadow-none"
                text={buttonLabel}
                colored
              />
              <span className="flex min-w-0 flex-col items-start overflow-hidden">
                <span className="chat-sidebar-label">Workspace</span>
                {vm.open ? (
                  <input
                    ref={vm.inputRef}
                    type="text"
                    value={vm.searchTerm}
                    onChange={(e) => vm.setSearchTerm(e.target.value)}
                    placeholder="Search workspaces…"
                    className="mt-0.5 w-full truncate border-none bg-transparent p-0 text-sm leading-tight outline-none"
                    style={{ fontSize: 16, WebkitTextSizeAdjust: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="mt-0.5 w-full truncate text-left text-sm leading-tight">
                    {buttonLabel}
                  </span>
                )}
              </span>
            </span>
            <ChevronDown
              className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                vm.open ? 'rotate-180' : ''
              }`}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent className="max-h-120 w-full min-w-[260px] overflow-auto rounded-lg border border-border bg-popover p-1 shadow-xl">
          {vm.error ? (
            <div className="px-3 py-6 text-center text-xs text-destructive">
              Couldn’t load workspaces
            </div>
          ) : vm.isLoading ? (
            <div className="p-1">
              <Skeleton className="mb-1 h-9 w-full rounded-md" />
              <Skeleton className="mb-1 h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ) : (
            <>
              {vm.activeError && (
                <div className="mx-1 mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                  Current workspace failed to load. Select another workspace.
                </div>
              )}
              {!vm.workspaces.length ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {vm.searchTerm ? (
                    <>
                      <div className="mb-1">No workspaces found</div>
                      <div className="opacity-70">
                        Try a different search term
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-1">No workspaces available</div>
                      <div className="opacity-70">
                        Contact your administrator
                      </div>
                    </>
                  )}
                </div>
              ) : (
                vm.workspaces.map((ws) => (
                  <WorkspaceRow
                    key={ws.id}
                    workspace={ws}
                    isActive={vm.activeWorkspaceId === ws.id}
                    onSelect={() =>
                      vm.onSelectWorkspace({
                        id: ws.id,
                        name: ws.name,
                        tags: ws.tags ?? [],
                      })
                    }
                  />
                ))
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

type RowProps = {
  workspace: Workspace;
  isActive?: boolean;
  onSelect: () => void;
};

function WorkspaceRow({ workspace, isActive, onSelect }: RowProps) {
  return (
    <div
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors ${
        isActive ? 'bg-secondary' : 'hover:bg-secondary/60'
      }`}
    >
      <CircleInitials
        className="h-7 w-7 min-w-[28px] text-[11px] shadow-none"
        text={workspace.name || ''}
        colored
      />
      <span className="flex-1 truncate">{workspace.name}</span>
      {isActive && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  );
}
