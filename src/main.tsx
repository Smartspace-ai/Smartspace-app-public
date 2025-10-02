// src/main.tsx
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import { msalInstance } from '@/platform/auth/msalClient'; // ✅ new path
import { EventMessage } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';

import AppProviders from '@/app/app'; // ✅ your providers component
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';
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

msalInstance.initialize().then(async () => {
  // Handle redirect promise to process authentication responses
  await msalInstance.handleRedirectPromise();
  
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((event: EventMessage) => {
    const accountsNow = msalInstance.getAllAccounts();
    if (accountsNow.length > 0) {
      msalInstance.setActiveAccount(accountsNow[0]);
    }
  });

  const rootElement =
    (document.getElementById('root') as HTMLElement) ??
    document.body.appendChild(document.createElement('div'));
  rootElement.id = 'root';

  const root = ReactDOM.createRoot(rootElement);
  const enableStrictMode = import.meta.env.VITE_ENABLE_STRICT_MODE === 'true';

  const app = (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <MsalProvider instance={msalInstance}>
        <AppProviders>
          <RouterProvider router={router} />
        </AppProviders>
      </MsalProvider>
    </ErrorBoundary>
  );

  root.render(enableStrictMode ? <StrictMode>{app}</StrictMode> : app);
});
