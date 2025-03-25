import { LogOut, Plus } from 'lucide-react';
import { ComponentProps } from 'react';
import { Logo } from '../../../assets/logo';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from '../../ui/sidebar';
import Threads from '../threads/threads';
import { WorkspaceSelector } from '../workspace-selector/workspace-selector';

export function SidebarLeft({ ...props }: ComponentProps<typeof Sidebar>) {
  const workspaces = [
    { id: 1, name: 'Personal Workspace' },
    { id: 2, name: 'Team Alpha' },
    { id: 3, name: 'Project X' },
    { id: 4, name: 'Marketing' },
  ];
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: '/placeholder.svg?height=32&width=32',
  };

  const handleLogout = () => {
    // Add your logout logic here
    console.log('Logging out...');
  };
  return (
    <Sidebar
      side="left"
      className="ss-sidebar__left border-r border-gray-100 bg-white"
    >
      <SidebarHeader className="h-14 flex items-center px-4 bg-white border-b px-4">
        {/* Logo Section */}
        <div className="flex items-center justify-between w-full gap-8">
          {/* logo */}
          <Logo />

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-xs">
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

      {/* Workspace Selector */}
      <WorkspaceSelector></WorkspaceSelector>

      <SidebarContent className="px-0 py-0 overflow-auto pb-16">
        {/* Threads Section */}
        <SidebarGroup>
          <Threads></Threads>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 mt-auto sticky bottom-0 bg-background">
        <Button className="w-full gap-2 text-xs h-9">
          <Plus className="h-3.5 w-3.5" />
          New Thread
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default SidebarLeft;
