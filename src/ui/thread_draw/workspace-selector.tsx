import { useWorkspace, useWorkspaces } from '@/domains/workspaces/queries';
import { Button } from '@/shared/ui/shadcn/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';

import { Workspace } from '@/domains/workspaces/schemas';
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';
import { CircleInitials } from '@/shared/components/circle-initials';
import { useSidebar } from '@/shared/ui/shadcn/sidebar';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import { useNavigate } from '@tanstack/react-router';
import debounce from 'lodash/debounce';
import { ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export function WorkspaceSelector() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const {workspaceId} = useRouteIds();
  const navigate = useNavigate();
  // Debounce search term update
  const debouncedSetSearchTerm = useState(() => debounce((value: string) => {
    setDebouncedSearchTerm(value);
  }, 300))[0];

  // Update debounced search term when searchTerm changes
  useEffect(() => {
    debouncedSetSearchTerm(searchTerm);
  }, [searchTerm, debouncedSetSearchTerm]);

  // Focus the input when popover opens and input is rendered
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const { data: workspaces, isLoading } = useWorkspaces(debouncedSearchTerm);
  const { data: activeWorkspace } = useWorkspace(workspaceId);
  // Close sidebar on workspace selection (mobile)
  const { isMobile, setOpenMobileLeft } = useSidebar();

  return (
    <div className="px-4 pt-3 pb-2 ">
      <div className="text-xs font-medium text-gray-500 mb-1.5">Workspace</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-xs h-9 border rounded-lg px-3 shadow-sm hover:shadow-md transition-shadow"
            onClick={() => setOpen((prev) => !prev)}
          >
            <div className="flex items-center gap-2 overflow-hidden w-full">
              {open ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search workspaces..."
                  className="truncate font-medium bg-transparent outline-none border-none p-0 m-0 text-xs w-full"
                  style={{ fontSize: 16, WebkitTextSizeAdjust: '100%' }}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                />
              ) : (
                <span className="truncate font-medium">
                  {activeWorkspace?.name}
                </span>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="rounded-lg p-0 border w-full min-w-[260px] max-h-120 overflow-auto">
          { isLoading? <Skeleton className="h-40 w-full rounded-lg" />
          : <div className='p-1 shadow-lg'>
              {workspaces && workspaces.length === 0 ? (
                <div className="px-3 py-6 text-center text-gray-500">
                  {debouncedSearchTerm ? (
                    <div className="text-xs">
                      <div className="mb-1">No workspaces found</div>
                      <div className="text-gray-400">Try a different search term</div>
                    </div>
                  ) : (
                    <div className="text-xs">
                      <div className="mb-1">No workspaces available</div>
                      <div className="text-gray-400">Contact your administrator</div>
                    </div>
                  )}
                </div>
              ) : (
                workspaces && workspaces.map((workspace) => (
                  <WorkspaceItem
                    key={workspace.id}
                    isActive={activeWorkspace?.id === workspace.id}
                    workspace={workspace}
                    onSelect={ws => {
                      navigate({
                        to: '/workspace/$workspaceId',
                        params: { workspaceId: ws.id },
                        replace: true,
                      })
                      setOpen(false);
                      setSearchTerm('');
                      // Close left sidebar on mobile after navigating
                      if (isMobile) {
                        setOpenMobileLeft(false);
                      }
                    }}
                  />
                ))
              )}
            </div>
          }
        </PopoverContent>
      </Popover>
    </div>
  );
}

type WorkspaceItemProps = {
  workspace: Workspace;
  isActive?: boolean;
  onSelect: (workspace: Workspace) => void;
};

function WorkspaceItem({ workspace, isActive, onSelect }: WorkspaceItemProps) {
  return (
    <div
      onClick={() => onSelect(workspace)}
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
