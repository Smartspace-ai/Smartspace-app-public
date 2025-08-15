import { PublicClientApplication } from '@azure/msal-browser';
import msalConfig from '@/app/msalConfig';

// Single MSAL instance exported for use across the app.
export const msalInstance = new PublicClientApplication(msalConfig);

export default msalInstance;


