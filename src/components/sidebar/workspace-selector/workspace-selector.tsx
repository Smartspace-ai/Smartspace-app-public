'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaces } from '@/hooks/use-workspaces';

import { ChevronDown } from 'lucide-react';
import { Workspace } from '../../../models/workspace';
import { getAvatarColour } from '../../../utils/avatar-colour';
import { getInitials } from '../../../utils/initials';

export function WorkspaceSelector() {
  const { workspaces, activeWorkspace, isLoading, handleWorkspaceChange } =
    useWorkspaces();

  if (isLoading) {
    return (
      <div className="px-4 pt-3 pb-2 ">
        <div className="text-xs font-medium text-gray-500 mb-1.5">
          Workspace
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-2 ">
      <div className="text-xs font-medium text-gray-500 mb-1.5">Workspace</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-xs h-9 border border-gray-200 rounded-lg px-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar
                className={`h-5 w-5 ${getAvatarColour(
                  activeWorkspace?.name || ''
                )} text-white shadow-sm`}
              >
                <AvatarFallback className="text-[10px] font-medium">
                  {getInitials(activeWorkspace?.name || '')}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">
                {activeWorkspace?.name}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] rounded-lg p-1 shadow-lg border-gray-100 ">
          {workspaces.map((workspace) => (
            <WorkspaceItem
              key={workspace.id}
              workspace={workspace}
              onSelect={handleWorkspaceChange}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type WorkspaceItemProps = {
  workspace: Workspace;
  onSelect: (workspace: Workspace) => void;
};

function WorkspaceItem({ workspace, onSelect }: WorkspaceItemProps) {
  return (
    <DropdownMenuItem
      onClick={() => onSelect(workspace)}
      className="text-xs py-2 px-2 rounded-md hover:bg-gray-50 cursor-pointer"
    >
      <div className="flex items-center gap-2 w-full">
        <Avatar
          className={`h-5 w-5 ${getAvatarColour(
            workspace.name
          )} text-white shadow-sm`}
        >
          <AvatarFallback className="text-[10px] font-medium">
            {getInitials(workspace.name)}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">{workspace.name}</span>
      </div>
    </DropdownMenuItem>
  );
}
