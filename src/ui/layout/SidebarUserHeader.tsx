// src/ui/layout/SidebarUserHeader.tsx
import { useMsal } from '@azure/msal-react';
import { LogOut } from 'lucide-react';

import { useTeams } from '@/app/providers';

import { useActiveUser } from '@/domains/users/use-active-user';


import {
    Avatar,
    AvatarFallback,
} from '@/shared/ui/mui-compat/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/ui/mui-compat/dropdown-menu';
import { SidebarHeader } from '@/shared/ui/mui-compat/sidebar';
import { getInitials } from '@/shared/utils/initials';

import { Logo } from '@/assets/logo';


export default function SidebarUserHeader() {
  const { isInTeams } = useTeams();
  const activeUser = useActiveUser();
  const { instance } = useMsal();

  const handleLogout = () => {
    const account = instance.getActiveAccount();
    if (!account) return;
    instance.logoutRedirect({
      account,
      // Must match an allowed post-logout redirect URI in Entra ID; do not force trailing slash.
      postLogoutRedirectUri: window.location.origin,
    });
  };

  if (isInTeams) return null;

  return (
    <SidebarHeader className="h-[54px] flex items-center px-4 border-b bg-background">
      <div className="flex items-center justify-between w-full gap-8">
        <Logo className="h-[40px]" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(activeUser.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
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
  );
}
