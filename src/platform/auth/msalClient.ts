import { msalConfig } from '@/platform/auth/msalConfig';
import { PublicClientApplication } from '@azure/msal-browser';

export const msalInstance = new PublicClientApplication(msalConfig);

// (Optional) If you use redirect flow, call this once at app bootstrap:
// await msalInstance.initialize();
// await msalInstance.handleRedirectPromise();
