import { PublicClientApplication } from '@azure/msal-browser';

import { getAuthConfigIssue, msalConfig } from '@/platform/auth/msalConfig';

let instance: PublicClientApplication | null = null;
let initError: Error | null = null;

export function getMsalInstance(): PublicClientApplication {
  if (instance) return instance;
  if (initError) throw initError;

  const configIssue = getAuthConfigIssue();
  if (configIssue) {
    initError = new Error(configIssue);
    throw initError;
  }

  try {
    instance = new PublicClientApplication(msalConfig);
    return instance;
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    throw initError;
  }
}
