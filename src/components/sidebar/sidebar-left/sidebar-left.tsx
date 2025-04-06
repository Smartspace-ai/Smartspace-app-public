import { useMsal } from '@azure/msal-react';
import { LogOut, Plus } from 'lucide-react';
import { ComponentProps, useContext } from 'react';
import { Logo } from '../../../assets/logo';
import { UserContext } from '../../../hooks/use-user-information';
import { getAvatarColour } from '../../../utils/avatar-colour';
import { getInitials } from '../../../utils/initials';
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
  SidebarHeader,
} from '../../ui/sidebar';
import Threads from '../threads/threads';
import { WorkspaceSelector } from '../workspace-selector/workspace-selector';

export function SidebarLeft({ ...props }: ComponentProps<typeof Sidebar>) {
  const { graphData, graphPhoto } = useContext(UserContext);
  const { instance } = useMsal();

  const activeUser = {
    name: graphData?.displayName ?? 'User',
    email: graphData?.mail ?? '',
    profilePhoto: graphPhoto || '',
  };

  const handleLogout = () => {
    const account = instance.getActiveAccount();

    if (!account) {
      console.warn('No active account to log out.');
      return;
    }

    instance.logoutRedirect({
      account,
      postLogoutRedirectUri: window.location.origin,
    });
  };

  return (
    <Sidebar side="left" className="ss-sidebar__left  border-r ">
      <SidebarHeader className="h-[55px] flex items-center px-4  border-b bg-background">
        {/* Logo Section */}
        <div className="flex items-center justify-between w-full gap-8">
          {/* logo */}
          <Logo />

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={activeUser.profilePhoto}
                    alt={activeUser.name}
                  />
                  <AvatarFallback
                    className={`text-xs ${getAvatarColour(activeUser.name)}`}
                  >
                    {getInitials(activeUser.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={activeUser.profilePhoto}
                      alt={activeUser.name}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(activeUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">
                      {activeUser.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {activeUser.email}
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

      <SidebarContent className="px-0 py-0 overflow-auto  h-full">
        {/* Workspace Selector */}
        <WorkspaceSelector></WorkspaceSelector>
        {/* Threads Section */}
        <Threads></Threads>
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
