import { useTeams } from '@/contexts/teams-context';
import { handleTrailingSlash } from '@/platform/auth/msalConfig';
import { useUserId } from '@/platform/auth/session';
import { useMsal } from '@azure/msal-react';
import { LogOut } from 'lucide-react';
import { ComponentProps } from 'react';
import { Logo } from '../../assets/logo';
import { Avatar, AvatarFallback, AvatarImage } from '../../shared/ui/shadcn/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../shared/ui/shadcn/dropdown-menu';
import { Sidebar, SidebarHeader } from '../../shared/ui/shadcn/sidebar';
import { getAvatarColour } from '../../shared/utils/avatar-colour';
import { getInitials } from '../../shared/utils/initials';
import Threads from './threads';
import { WorkspaceSelector } from './workspace-selector';


export function SidebarLeft({ ...props }: ComponentProps<typeof Sidebar>) {
  const { instance } = useMsal();
  const { isInTeams } = useTeams();

  const activeUserId = useUserId();
  // const getActiveUser = useGetActiveUser();

  const handleLogout = () => {
    const account = instance.getActiveAccount();

    if (!account) {
      console.warn('No active account to log out.');
      return;
    }

    instance.logoutRedirect({
      account,
      postLogoutRedirectUri: handleTrailingSlash(window.location.origin),
    });
  };

  return (
    <Sidebar side="left" className="ss-sidebar__left border-r" {...props}>
      
      {!isInTeams && 
        <SidebarHeader className="h-[55px] flex items-center px-4 border-b bg-background">
          {/* Logo Section */}
          <div className="flex items-center justify-between w-full gap-8">
            {/* Logo */}
            <Logo className="h-[40px]" />

            {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        // src={activeUser.profilePhoto}
                        alt={activeUserId}
                      />
                      <AvatarFallback
                        className={`text-xs ${getAvatarColour(activeUserId)}`}
                      >
                        {getInitials(activeUserId)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          // src={activeUser.profilePhoto}
                          alt={activeUserId}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(activeUserId)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">
                          {activeUserId}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {activeUserId}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-xs cursor-pointer"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </SidebarHeader>
      }

      {/* Workspace Selector */}
      <WorkspaceSelector />
      {/* Threads Section */}
      <Threads />
    </Sidebar>
  );
}

export default SidebarLeft;