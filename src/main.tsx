// src/main.tsx
import { EventMessage } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { msalInstance } from '@/platform/auth/msalClient';

import AppProviders from '@/app/AppProviders'; // <- fix case

import { routeTree } from './routeTree.gen';

function fallbackRender({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  );
}

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

(async () => {
  try {
    await msalInstance.initialize();
    await msalInstance.handleRedirectPromise();

    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
      msalInstance.setActiveAccount(accounts[0]);
    }

    // optional: you can keep this for account changes
    msalInstance.addEventCallback((event: EventMessage) => {
      const accountsNow = msalInstance.getAllAccounts();
      if (accountsNow.length > 0) {
        msalInstance.setActiveAccount(accountsNow[0]);
      }
    });
  } catch (e) {
    // If MSAL init fails, we still render the app; transport layer will 401 as needed
    // Optionally log or show a toast here
    // console.error('MSAL init error', e);
  }

  const rootElement =
    (document.getElementById('root') as HTMLElement) ??
    document.body.appendChild(document.createElement('div'));
  rootElement.id = 'root';

  const root = ReactDOM.createRoot(rootElement);
  const enableStrictMode = import.meta.env.VITE_ENABLE_STRICT_MODE === 'true';

  const app = (
    <ErrorBoundary fallbackRender={fallbackRender}>
      {/* Harmless in Teams: MsalProvider just provides context; transport switches to NAA */}
      <MsalProvider instance={msalInstance}>
        <AppProviders>
          <RouterProvider router={router} />
        </AppProviders>
      </MsalProvider>
    </ErrorBoundary>
  );

  root.render(enableStrictMode ? <StrictMode>{app}</StrictMode> : app);
})();
