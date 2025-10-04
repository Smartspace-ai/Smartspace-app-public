// src/ui/layout/SidebarUserHeader.tsx
import { useMsal } from '@azure/msal-react';
import { LogOut } from 'lucide-react';

import { handleTrailingSlash } from '@/platform/auth/msalConfig';
import { useUserId } from '@/platform/auth/session';

import { useTeams } from '@/app/providers';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
import { getAvatarColour } from '@/shared/utils/avatarColour';
import { getInitials } from '@/shared/utils/initials';

import { Logo } from '@/assets/logo';


export default function SidebarUserHeader() {
  const { isInTeams } = useTeams();
  const activeUserId = useUserId();
  const { instance } = useMsal();

  const handleLogout = () => {
    const account = instance.getActiveAccount();
    if (!account) return;
    instance.logoutRedirect({
      account,
      postLogoutRedirectUri: handleTrailingSlash(window.location.origin),
    });
  };

  if (isInTeams) return null;

  return (
    <SidebarHeader className="h-[55px] flex items-center px-4 border-b bg-background">
      <div className="flex items-center justify-between w-full gap-8">
        <Logo className="h-[40px]" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarImage alt={activeUserId} />
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
                  <AvatarImage alt={activeUserId} />
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
  );
}
