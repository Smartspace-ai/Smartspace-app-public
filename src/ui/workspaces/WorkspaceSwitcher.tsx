// src/ui/workspaces/WorkspaceSwitcher.tsx
import Skeleton from '@mui/material/Skeleton';
import { ChevronDown } from 'lucide-react';

import { Workspace } from '@/domains/workspaces/model';

import { CircleInitials } from '@/shared/components/circle-initials';
import { Button } from '@/shared/ui/mui-compat/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/mui-compat/popover';

import { getTagChipClasses } from '@/theme/tag-styles';

import { useWorkspaceSwitcherVm } from './WorkspaceSwitcher.vm';

function TagChips({ tags, className }: { tags?: string[]; className?: string }) {
  const list = (tags ?? []).filter(Boolean);
  if (!list.length) return null;

  return (
    <span className={className ?? 'ml-2 flex items-center gap-1 flex-wrap'}>
      {list.map((t, i) => {
        const v = (t || '').toString();
        const cls = getTagChipClasses(v);
        return (
          <span key={`${v}-${i}`} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${cls}`}>
            {v}
          </span>
        );
      })}
    </span>
  );
}

export function WorkspaceSwitcher() {
  const vm = useWorkspaceSwitcherVm();

  const buttonLabel = vm.activeError
    ? 'Failed to load workspace'
    : (vm.activeWorkspaceName ?? vm.activeWorkspace?.name)
      ? (vm.activeWorkspaceName ?? vm.activeWorkspace?.name ?? '—')
      : vm.activeLoading
        ? 'Loading workspace…'
        : '—';

  const buttonClassName = [
    'w-full justify-between text-xs h-9 border rounded-lg px-3 shadow-sm hover:shadow-md transition-shadow',
    vm.activeError ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10' : '',
    vm.activeLoading ? 'opacity-90' : '',
  ].join(' ').trim();

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="text-xs font-medium text-gray-500 mb-1.5">Workspace</div>
      <Popover open={vm.open} onOpenChange={vm.setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={buttonClassName}
            onClick={() => vm.setOpen(prev => !prev)}
            aria-busy={vm.activeLoading}
            aria-invalid={!!vm.activeError}
            title={vm.activeError ? 'Active workspace failed to load' : undefined}
          >
            <div className="flex items-center gap-2 overflow-hidden w-full">
              {vm.open ? (
                <input
                  ref={vm.inputRef}
                  type="text"
                  value={vm.searchTerm}
                  onChange={e => vm.setSearchTerm(e.target.value)}
                  placeholder="Search workspaces..."
                  className="truncate font-medium bg-transparent outline-none border-none p-0 m-0 text-xs w-full"
                  style={{ fontSize: 16, WebkitTextSizeAdjust: '100%' }}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                />
              ) : (
                <span className="truncate font-medium flex items-center gap-1">
                  {buttonLabel}
                  <TagChips tags={vm.activeWorkspaceTags} className="flex items-center gap-1 flex-wrap" />
                </span>
              )}
            </div>
            <ChevronDown className={vm.activeError ? 'h-3.5 w-3.5 text-destructive' : 'h-3.5 w-3.5 text-gray-400'} />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="rounded-lg p-0 border w-full min-w-[260px] max-h-120 overflow-auto">
          {vm.error ? (
            <div className="px-3 py-6 text-center text-destructive text-xs">Couldn’t load workspaces</div>
          ) : vm.isLoading ? (
            <div className="p-2">
              <Skeleton className="h-8 w-full mb-2 rounded-md" />
              <Skeleton className="h-8 w-full mb-2 rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ) : (
            <div className="p-1 shadow-lg">
              {vm.activeError && (
                <div className="mx-1 mb-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-2 py-1 text-xs">
                  Current workspace failed to load. Select another workspace.
                </div>
              )}
              {!vm.workspaces.length ? (
                <div className="px-3 py-6 text-center text-gray-500 text-xs">
                  {vm.searchTerm ? (
                    <>
                      <div className="mb-1">No workspaces found</div>
                      <div className="text-gray-400">Try a different search term</div>
                    </>
                  ) : (
                    <>
                      <div className="mb-1">No workspaces available</div>
                      <div className="text-gray-400">Contact your administrator</div>
                    </>
                  )}
                </div>
              ) : (
                vm.workspaces.map(ws => (
                  <WorkspaceRow
                    key={ws.id}
                    workspace={ws}
                    isActive={vm.activeWorkspaceId === ws.id}
                    onSelect={() => vm.onSelectWorkspace({ id: ws.id, name: ws.name, tags: ws.tags ?? [] })}
                  />
                ))
              )}
            </div>
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
      className="text-xs py-2 px-2 rounded-md hover:bg-gray-50 cursor-pointer"
      tabIndex={0}
      role="button"
      aria-pressed={isActive}
    >
      <div className="flex items-center gap-2 w-full">
        <CircleInitials
          className={isActive ? 'bg-primary/80 text-[hsl(var(--primary-foreground))]' : 'bg-gray-200'}
          text={workspace.name || ''}
        />
        <span className="font-medium">{workspace.name}</span>
        <TagChips tags={workspace.tags} className="ml-auto flex items-center gap-1" />
      </div>
    </div>
  );
}
