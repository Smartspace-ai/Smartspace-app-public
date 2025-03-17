import { ChevronDown, LogOut, Plus, Search } from 'lucide-react';
import { Logo } from '../../../assets/logo';
import { Button } from '../../ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '../../ui/sidebar';
import Threads from '../threads/threads';
import Workspaces from '../workspaces/workspaces';
import styles from './sidebar-left.module.scss';
import { ComponentProps, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Separator } from '../../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Input } from '../../ui/input';

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

  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]);

  const handleLogout = () => {
    // Add your logout logic here
    console.log('Logging out...');
  };
  return (
    <Sidebar side="left">
      <div
        id="sidebar"
        className="sidebar sidebar__left h-screen flex flex-col bg-card border-r-0"
      >
        <SidebarHeader className="h-14 flex justify-between border-b p-0">
          {/* Logo Section */}
          <div className="p-4 pb-2">
            <div className="flex items-center gap-2 mb-2">
              {/* Logo */}
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary-foreground"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold">Project Hub</h1>
            </div>
          </div>

          {/* User Profile - More subtle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full absolute top-4 right-4"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuLabel className="font-normal p-0">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-10 w-10 border-2 border-primary/10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
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
              <DropdownMenuSeparator className="my-1" />
              <div className="p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>
        {/* <Workspaces></Workspaces> */}
        <SidebarContent className="p-0">
          {/* Workspace Selector */}
          <div className="px-4 py-8 pb-6 ">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="truncate">{selectedWorkspace.name}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search workspaces..."
                      className="pl-8"
                    />
                  </div>
                </div>
                <DropdownMenuSeparator />
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => setSelectedWorkspace(workspace)}
                  >
                    {workspace.name}
                    {workspace.id === selectedWorkspace.id && (
                      <span className="ml-auto">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Threads></Threads>
        </SidebarContent>
        <SidebarFooter>
          <div className="sidebar__footer p-4">
            <Button className="sidebar__new-thread-button w-full">
              <Plus className="mr-2 h-4 w-4" /> New Thread
            </Button>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

export default SidebarLeft;
