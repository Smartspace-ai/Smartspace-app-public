import { msalInstance } from '@/platform/auth/msalClient';

import { useTeams } from '@/app/providers';

export const useActiveUser = () => {
  const account = msalInstance.getActiveAccount();
  const { isInTeams, teamsUser } = useTeams();

  if (account) {
    return {
      name: account.name ?? 'User',
      email: account.username,
      id: account.localAccountId,
    };
  }

  // Fallback for Teams: derive identity from Teams context without throwing
  if (isInTeams && teamsUser) {
    const displayName = (teamsUser as unknown as { displayName?: string }).displayName;
    const upn = (teamsUser as unknown as { userPrincipalName?: string }).userPrincipalName;
    const id = (teamsUser as unknown as { id?: string }).id;
    return {
      name: displayName ?? 'User',
      email: upn ?? '',
      id: id ?? 'teams-user',
    };
  }

  // Non-Teams and no MSAL account: return a benign placeholder to avoid app crash
  return {
    name: 'User',
    email: '',
    id: 'anonymous',
  };
}
