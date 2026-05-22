import { MsalContext } from '@azure/msal-react';
import { useContext } from 'react';

import { useTeams } from '@/app/providers';

/**
 * Returns the currently-signed-in user for display purposes.
 *
 * In E2E bypass mode (VITE_E2E_AUTH_BYPASS=true) the render tree has no
 * MsalProvider, so useMsal() would throw.  We access MsalContext via
 * useContext() instead — which returns undefined rather than throwing when
 * the context is absent — and return a synthetic stub in that case.
 */
export const useActiveUser = () => {
  const msalCtx = useContext(MsalContext);
  const { isInTeams, teamsUser } = useTeams();

  // E2E bypass: MsalProvider is not mounted, so msalCtx is undefined.
  // Return a synthetic session that matches the E2E auth adapter's getSession().
  if (!msalCtx) {
    return {
      name: 'E2E Test User',
      email: '',
      id: 'e2e-user-id',
    };
  }

  const { instance, accounts } = msalCtx;
  const account = instance.getActiveAccount() ?? accounts?.[0] ?? null;
  if (account) {
    return {
      name: account.name ?? 'User',
      email: account.username,
      id: account.localAccountId,
    };
  }

  // Fallback for Teams: derive identity from Teams context without throwing
  if (isInTeams && teamsUser) {
    const displayName = (teamsUser as unknown as { displayName?: string })
      .displayName;
    const upn = (teamsUser as unknown as { userPrincipalName?: string })
      .userPrincipalName;
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
};
