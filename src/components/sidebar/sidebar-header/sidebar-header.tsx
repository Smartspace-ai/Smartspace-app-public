import { useTeams } from '@/contexts/teams-context';
import { useActiveUser } from '@/hooks/auth/use-active-user';
import { useMsal } from '@azure/msal-react';
import { LogOut } from 'lucide-react';
import { ComponentProps } from 'react';
import { Logo } from '../../../assets/logo';
import { getAvatarColour } from '../../../utils/avatar-colour';
import { getInitials } from '../../../utils/initials';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';

export function SidebarHeader() {
  const { instance } = useMsal();
  const { isInTeams } = useTeams();

  const activeUser = useActiveUser();

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
    <div>
      <p>hello</p>
    </div>
  )

  // return (
  //     {!isInTeams && 
  //         {/* Logo Section */}
  //         <div className="flex items-center justify-between w-full gap-8">
  //           {/* Logo */}
  //           <Logo className="h-[40px]" />

  //           {/* User Profile */}
  //           {/* <UserProfile /> */}
  
  //         </div>
  //     }
  // );
}

