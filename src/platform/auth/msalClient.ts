import { PublicClientApplication } from '@azure/msal-browser';

import { msalConfig } from '@/platform/auth/msalConfig';

export const msalInstance = new PublicClientApplication(msalConfig);

// (Optional) If you use redirect flow, call this once at app bootstrap:
// await msalInstance.initialize();
// await msalInstance.handleRedirectPromise();
