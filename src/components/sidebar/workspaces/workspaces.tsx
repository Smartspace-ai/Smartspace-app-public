import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/button';
import styles from './workspaces.module.scss';

import { useQueryWorkspaces } from '../../../hooks/use-workspaces';
import { Workspace } from '../../../models/workspace';
import { getInitials } from '../../../utils/initials';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';

export function Workspaces() {
  const [open, setOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );

  const { queryWorkspaces } = useQueryWorkspaces();
  const { data: workspaces } = queryWorkspaces;

  const currentWorkspace = (workspaces || []).find(
    (workspace) => workspace.id === selectedWorkspace?.id
  );

  return (
    <div className={`sidebar__workspaces my-5 w-full`}>
      <label
        htmlFor="available-workspaces"
        className="block text-xs font-medium text-gray-700 mb-1"
      >
        Workspace
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedWorkspace ? (
              <div className="flex items-center">
                <Avatar className="mr-2 h-6 w-6 rounded-full bg-slate-400 flex items-center justify-center">
                  {getInitials(selectedWorkspace.name)}
                </Avatar>
                <span className="block truncate text-base font-semibold">
                  {selectedWorkspace.name}
                </span>
              </div>
            ) : (
              <span className="block truncate text-base font-semibold text-gray-400">
                Select workspace...
              </span>
            )}
            <ChevronsUpDown className="ml-auto h-4 w-4 text-gray-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search workspace..." />
            <CommandList>
              <CommandEmpty>No workspace found.</CommandEmpty>
              <CommandGroup>
                {(workspaces || []).map((workspace) => (
                  <CommandItem
                    className="cursor-pointer"
                    key={workspace.id}
                    value={workspace.id}
                    onSelect={(workspace) => {
                      console.log(workspace);
                      setOpen(false);
                    }}
                  >
                    <Avatar className="mr-2 h-6 w-6">
                      <AvatarFallback>
                        {getInitials(workspace.name)}
                      </AvatarFallback>
                    </Avatar>

                    {workspace.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default Workspaces;
