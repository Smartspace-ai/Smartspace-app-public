import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import {
  AuthenticatedTemplate,
  MsalProvider,
  UnauthenticatedTemplate,
} from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';

import App from './app/app';
import msalConfig from './app/msalConfig';
import Login from './pages/Login/Login';

const msalInstance = new PublicClientApplication(msalConfig);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <AuthenticatedTemplate>
        <App />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
    </MsalProvider>
  </StrictMode>
);
