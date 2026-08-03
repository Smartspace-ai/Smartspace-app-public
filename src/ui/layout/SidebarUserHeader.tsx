// src/ui/layout/SidebarUserHeader.tsx
import { useMsal } from '@azure/msal-react';
import { ChevronsUpDown, LogOut } from 'lucide-react';

import { handleTrailingSlash } from '@/platform/auth/msalConfig';

import { useTeams } from '@/app/providers';

import { useActiveUser } from '@/domains/users';

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
import { getInitials } from '@/shared/utils/initials';

import { Logo } from '@/assets/logo';
import { getUserPhotoUrl } from '@smartspace/chat-ui';

/** Brand row at the top of the left rail. */
export default function SidebarUserHeader() {
  const { isInTeams } = useTeams();

  if (isInTeams) return null;

  return (
    // Plain div rather than `SidebarHeader`: its default `p-2` is emitted by
    // both stylesheets in play and beats the padding overrides passed here.
    <div className="px-5 pt-5">
      {/* Scale by width, not height: the wordmark is wide enough that a fixed
          height overflows the 300px rail, and an over-constrained <svg> crops
          instead of shrinking. `max-w` pins it to the size it settles at in the
          desktop rail — without it the logo grew with the container and was
          several times too large inside the wider overlay rail on mobile. */}
      <Logo className="h-auto max-h-10 w-full max-w-[210px]" />
    </div>
  );
}

/**
 * Account row pinned to the bottom of the left rail, below the new-thread
 * button. Separate from the brand row above so the logo can use the rail's
 * full width, matching the reference design.
 */
export function SidebarUserMenu() {
  const { isInTeams } = useTeams();
  const activeUser = useActiveUser();
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
    <div className="mt-3 border-t pt-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary"
            aria-label="Account menu"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={getUserPhotoUrl(activeUser.id)}
                alt={activeUser.name}
              >
                <AvatarFallback className="text-xs">
                  {getInitials(activeUser.name)}
                </AvatarFallback>
              </AvatarImage>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {activeUser.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {activeUser.email}
              </p>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage
                  src={getUserPhotoUrl(activeUser.id)}
                  alt={activeUser.name}
                >
                  <AvatarFallback className="text-xs">
                    {getInitials(activeUser.name)}
                  </AvatarFallback>
                </AvatarImage>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="mb-1 truncate text-sm font-medium leading-none">
                  {activeUser.name}
                </p>
                <p
                  className="truncate text-xs leading-none text-muted-foreground"
                  title={activeUser.email}
                >
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
  );
}
