import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useActiveWorkspace, useWorkspaces } from '@/hooks/use-workspaces';

import { CircleInitials } from '@/components/circle-initials';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import debounce from 'lodash/debounce';
import { ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Workspace } from '../../../models/workspace';

export function WorkspaceSelector() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  const { workspaces, isLoading, handleWorkspaceChange } = useWorkspaces(debouncedSearchTerm);
  const { data: activeWorkspace } = useActiveWorkspace();
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
                <span className="truncate font-medium flex items-center gap-1">
                  {activeWorkspace?.name}
                  {/* Render tags next to active workspace name */}
                  {(activeWorkspace?.tags || []).map((t, i) => {
                    const v = (t || '').toString();
                    const l = v.toLowerCase();
                    const cls = l === 'safe'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : l === 'unsafe'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200';
                    return (
                      <span key={`${v}-${i}`} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${cls}`}>
                        {v}
                      </span>
                    );
                  })}
                </span>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="rounded-lg p-0 border w-full min-w-[260px] max-h-120 overflow-auto">
          { isLoading? <Skeleton className="h-40 w-full rounded-lg" />
          : <div className='p-1 shadow-lg'>
              {workspaces.length === 0 ? (
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
                workspaces.map((workspace) => (
                  <WorkspaceItem
                    key={workspace.id}
                    isActive={activeWorkspace?.id === workspace.id}
                    workspace={workspace}
                    onSelect={ws => {
                      handleWorkspaceChange(ws);
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
      className={`text-xs py-2 px-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50`}
      tabIndex={0}
      role="button"
    >
      <div className="flex items-center gap-2 w-full">
        <CircleInitials
          className={
              isActive
              ? 'bg-primary/80 text-[hsl(var(--primary-foreground))]'
              : 'bg-gray-200'
          }
          text={workspace.name || ''}
        />
        <span className={'font-medium'}>
          {workspace.name}
        </span>
        {/* Render all tags for option */}
        <span className="ml-auto flex items-center gap-1">
          {(workspace.tags || []).map((t, i) => {
            const v = (t || '').toString();
            const l = v.toLowerCase();
            const cls = l === 'safe'
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : l === 'unsafe'
              ? 'bg-red-100 text-red-700 border-red-200'
              : 'bg-gray-100 text-gray-700 border-gray-200';
            return (
              <span key={`${v}-${i}`} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${cls}`}>
                {v}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}
