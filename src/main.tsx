import {
  EventMessage,
  PublicClientApplication
} from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import { ErrorBoundary } from "react-error-boundary";
import App from './app/app';
import msalConfig from './app/msalConfig';
import { TeamsProvider } from './contexts/teams-context';

// 🔑 MSAL instance creation
export const msalInstance = new PublicClientApplication(msalConfig);

// ✅ Initialize and set active account if one exists
msalInstance.initialize().then(() => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  // 🔁 Set active account on login success
  msalInstance.addEventCallback((event: EventMessage) => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  });

  const rootElement =
    (document.getElementById('root') as HTMLElement) ??
    document.body.appendChild(document.createElement('div'));
  rootElement.id = 'root';

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary
        fallbackRender={fallbackRender}
      >
        <TeamsProvider>
          <MsalProvider instance={msalInstance}>
            <App />
          </MsalProvider>
        </TeamsProvider>
      </ErrorBoundary>
    </StrictMode>
  );
});

function fallbackRender({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </div>
  );
}