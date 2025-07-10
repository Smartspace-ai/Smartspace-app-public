

import { msalInstance } from '../main';

export const useActiveUser = () => {
  const account = msalInstance.getActiveAccount();
  if (!account) {
    throw new Error(
      'No active account! Verify a user has been signed in and setActiveAccount has been called.'
    );
  }

  return {
    name: account.name ?? "User",
    email: account.username,
    id: account.localAccountId,
  };
}
