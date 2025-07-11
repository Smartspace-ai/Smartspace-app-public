import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useActiveWorkspace, useWorkspaces } from '@/hooks/use-workspaces';

import { CircleInitials } from '@/components/circle-initials';
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
  const activeWorkspace = useActiveWorkspace();

  return (
    <div style={{ width: '100%' }} className="flex items-center justify-center">
      {!activeWorkspace? <Skeleton className="h-9 min-w-[300px] rounded" /> :
        <div className="min-w-[250px] pt-2 pb-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between text-xs h-10 border-0 rounded-lg px-5 { }"
                onClick={() => setOpen((prev) => !prev)}
              >
                <div className="flex items-center justify-center overflow-hidden w-full">
                  {open ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search workspaces..."
                      className="truncate font-medium bg-transparent outline-none border-none p-0 m-0 text-xs w-full"
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate font-semibold text-primary text-base text-center w-full">
                      {activeWorkspace?.name}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="rounded-lg p-0 border w-full min-w-[250px] max-h-120 overflow-auto">
              { isLoading? <Skeleton className="h-40 w-full rounded-lg" />
              : <div className='p-1 shadow-lg'>
                  {workspaces.map((workspace) => (
                    <WorkspaceItem
                      key={workspace.id}
                      isActive={activeWorkspace?.id === workspace.id}
                      workspace={workspace}
                      onSelect={ws => {
                        handleWorkspaceChange(ws);
                        setOpen(false);
                        setSearchTerm('');
                      }}
                    />
                  ))}
                </div>
              }
            </PopoverContent>
          </Popover>
        </div>
      }
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
        <span className="font-semibold">{workspace.name}</span>
      </div>
    </div>
  );
}
