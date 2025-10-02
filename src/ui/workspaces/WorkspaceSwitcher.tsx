// src/ui/workspaces/WorkspaceSwitcher.tsx
import { Workspace } from '@/domains/workspaces/schemas';
import { CircleInitials } from '@/shared/components/circle-initials';
import { Button } from '@/shared/ui/shadcn/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import { ChevronDown } from 'lucide-react';
import { useWorkspaceSwitcherVm } from './WorkspaceSwitcher.vm';

export function WorkspaceSwitcher() {
  const vm = useWorkspaceSwitcherVm();

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="text-xs font-medium text-gray-500 mb-1.5">Workspace</div>
      <Popover open={vm.open} onOpenChange={vm.setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-xs h-9 border rounded-lg px-3 shadow-sm hover:shadow-md transition-shadow"
            onClick={() => vm.setOpen(prev => !prev)}
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
                <span className="truncate font-medium">
                  {vm.activeWorkspace?.name ?? '—'}
                </span>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="rounded-lg p-0 border w-full min-w-[260px] max-h-120 overflow-auto">
          {vm.isLoading ? (
            <Skeleton className="h-40 w-full rounded-lg" />
          ) : (
            <div className="p-1 shadow-lg">
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
                    isActive={vm.activeWorkspace?.id === ws.id}
                    onSelect={() => vm.onSelectWorkspace(ws.id)}
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
      className="text-xs py-2 px-2 rounded-md hover:bg-gray-50 cursor-pointer"
      tabIndex={0}
      role="button"
    >
      <div className="flex items-center gap-2 w-full">
        <CircleInitials
          className={isActive ? 'bg-primary/80 text-[hsl(var(--primary-foreground))]' : 'bg-gray-200'}
          text={workspace.name || ''}
        />
        <span className="font-medium">{workspace.name}</span>
      </div>
    </div>
  );
}
