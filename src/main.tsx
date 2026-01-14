// src/main.tsx
import { EventMessage } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { msalInstance } from '@/platform/auth/msalClient'; // ✅ new path

import AppProviders from '@/app/AppProviders';

import { routeTree } from '@/routeTree';

function removeBootSplash() {
  try {
    document.getElementById('ss-boot-splash')?.remove();
  } catch {
    // ignore DOM failures
  }
}

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

msalInstance
  .initialize()
  .then(async () => {
    // Handle redirect promise to process authentication responses
    await msalInstance.handleRedirectPromise();

    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }

    msalInstance.addEventCallback((_event: EventMessage) => {
      const accountsNow = msalInstance.getAllAccounts();
      if (accountsNow.length > 0) {
        msalInstance.setActiveAccount(accountsNow[0]);
      }
    });

    const rootElement =
      (document.getElementById('root') as HTMLElement) ??
      document.body.appendChild(document.createElement('div'));
    rootElement.id = 'root';

    removeBootSplash();

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary fallbackRender={fallbackRender}>
          <MsalProvider instance={msalInstance}>
            <AppProviders>
              <RouterProvider router={router} />
            </AppProviders>
          </MsalProvider>
        </ErrorBoundary>
      </StrictMode>
    );
  })
  .catch((e) => {
    // Don't leave users stuck on an infinite splash screen.
    removeBootSplash();
    // Surface error in console; ErrorBoundary won't catch errors before render.
    // eslint-disable-next-line no-console
    console.error('MSAL initialization failed', e);

    const rootElement =
      (document.getElementById('root') as HTMLElement) ??
      document.body.appendChild(document.createElement('div'));
    rootElement.id = 'root';

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <StrictMode>
        <div role="alert" style={{ padding: 16 }}>
          <p>Failed to initialize authentication.</p>
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
            {String((e as Error)?.message ?? e)}
          </pre>
        </div>
      </StrictMode>
    );
  });
