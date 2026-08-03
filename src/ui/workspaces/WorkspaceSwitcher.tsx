// src/ui/workspaces/WorkspaceSwitcher.tsx
import Skeleton from '@mui/material/Skeleton';
import { ChevronDown } from 'lucide-react';

import { CircleInitials } from '@/shared/components/circle-initials';
import { Button } from '@/shared/ui/mui-compat/button';
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

  const buttonClassName = [
    'w-full h-auto justify-between rounded-md border border-border bg-background px-3 py-2.5 text-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-background',
    vm.activeError
      ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10'
      : '',
    vm.activeLoading ? 'opacity-90' : '',
  ]
    .join(' ')
    .trim();

  return (
    <div className="px-5 pt-4 pb-4">
      <Popover open={vm.open} onOpenChange={vm.setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={buttonClassName}
            onClick={() => vm.setOpen((prev) => !prev)}
            aria-busy={vm.activeLoading}
            aria-invalid={!!vm.activeError}
            title={
              vm.activeError ? 'Active workspace failed to load' : undefined
            }
          >
            <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
              <CircleInitials
                className="h-7 w-7 min-w-[28px] text-[10px]"
                text={buttonLabel}
                colored
              />
              <div className="flex min-w-0 flex-col items-start overflow-hidden">
                <span className="text-[10px] font-normal leading-none text-muted-foreground">
                  Workspace
                </span>
                {vm.open ? (
                  <input
                    ref={vm.inputRef}
                    type="text"
                    value={vm.searchTerm}
                    onChange={(e) => vm.setSearchTerm(e.target.value)}
                    placeholder="Search workspaces..."
                    className="mt-1 w-full truncate border-none bg-transparent p-0 text-sm font-medium leading-none outline-none"
                    style={{ fontSize: 16, WebkitTextSizeAdjust: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="mt-1 max-w-full truncate text-sm font-medium leading-none">
                    {buttonLabel}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown
              className={`ml-2 h-4 w-4 shrink-0 transition-transform duration-200 ${
                vm.activeError ? 'text-destructive' : 'text-muted-foreground'
              } ${vm.open ? 'rotate-180' : ''}`}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full min-w-[260px] max-h-120 overflow-auto rounded-lg border border-switcher-border bg-switcher p-1 text-switcher-foreground shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
          {vm.error ? (
            <div className="px-3 py-6 text-center text-destructive text-xs">
              Couldn’t load workspaces
            </div>
          ) : vm.isLoading ? (
            <div className="p-1">
              <Skeleton className="h-9 w-full mb-1 rounded-md" />
              <Skeleton className="h-9 w-full mb-1 rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ) : (
            <>
              {vm.activeError && (
                <div className="mx-1 mb-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-2 py-1 text-xs">
                  Current workspace failed to load. Select another workspace.
                </div>
              )}
              {!vm.workspaces.length ? (
                <div className="px-3 py-6 text-center text-xs text-switcher-foreground/60">
                  {vm.searchTerm ? (
                    <>
                      <div className="mb-1">No workspaces found</div>
                      <div className="text-switcher-foreground/40">
                        Try a different search term
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-1">No workspaces available</div>
                      <div className="text-switcher-foreground/40">
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
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-switcher-accent ${
        isActive ? 'bg-switcher-accent' : ''
      }`}
      tabIndex={0}
      role="button"
      aria-pressed={isActive}
    >
      <CircleInitials
        className="h-7 w-7 min-w-[28px] text-[11px]"
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
