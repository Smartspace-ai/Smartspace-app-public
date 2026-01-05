import type { IPublicClientApplication } from '@azure/msal-browser';

const MSAL_ACTIVE_HOME_ACCOUNT_ID_KEY = 'msalActiveHomeAccountId';

type AccountLike = { homeAccountId?: string } | null | undefined;

function getSavedHomeAccountId(): string | null {
  try {
    return localStorage.getItem(MSAL_ACTIVE_HOME_ACCOUNT_ID_KEY);
  } catch {
    return null;
  }
}

function saveHomeAccountId(account: AccountLike) {
  try {
    const id = account?.homeAccountId;
    if (typeof id === 'string' && id.length) {
      localStorage.setItem(MSAL_ACTIVE_HOME_ACCOUNT_ID_KEY, id);
    }
  } catch {
    // ignore storage failures
  }
}

export function pickPreferredMsalAccount(instance: IPublicClientApplication) {
  const active = instance.getActiveAccount();
  if (active) return active;

  const all = instance.getAllAccounts();
  if (all.length === 0) return null;

  const saved = getSavedHomeAccountId();
  if (saved) {
    const match = all.find((a) => a.homeAccountId === saved);
    if (match) return match;
  }

  return all[0];
}

export function setMsalActiveAccount(instance: IPublicClientApplication, account: AccountLike) {
  if (!account) return;
  instance.setActiveAccount(account as any);
  saveHomeAccountId(account);
}

export async function ensureMsalActiveAccount(instance: IPublicClientApplication) {
  const preferred = pickPreferredMsalAccount(instance);
  if (preferred) setMsalActiveAccount(instance, preferred);
}


