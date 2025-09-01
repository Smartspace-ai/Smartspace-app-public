import msalConfig from '@/app/msalConfig';
import { PublicClientApplication } from '@azure/msal-browser';

// Single MSAL instance exported for use across the app.
export const msalInstance = new PublicClientApplication(msalConfig);

export default msalInstance;



