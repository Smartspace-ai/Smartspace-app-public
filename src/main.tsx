// src/main.tsx
import { EventMessage } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { getMsalInstance } from '@/platform/auth/msalClient'; // ✅ new path

import AppProviders from '@/app/AppProviders';

import { routeTree } from '@/routeTree.gen';

function removeBootSplash() {
  try {
    document.getElementById('ss-boot-splash')?.remove();
  } catch {
    // ignore DOM failures
  }
}

function renderBootstrapError(message: string) {
  try {
    const rootElement =
      (document.getElementById('root') as HTMLElement) ??
      document.body.appendChild(document.createElement('div'));
    rootElement.id = 'root';

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <StrictMode>
        <div role="alert" style={{ padding: 16 }}>
          <p>Failed to start the app.</p>
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{message}</pre>
        </div>
      </StrictMode>
    );
  } catch {
    // ignore: fallback to console only
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

let msal: ReturnType<typeof getMsalInstance> | null = null;
try {
  msal = getMsalInstance();
} catch (e) {
  // Don't leave users stuck on an infinite splash screen.
  removeBootSplash();
  // eslint-disable-next-line no-console
  console.error('MSAL config error', e);
  renderBootstrapError(String((e as Error)?.message ?? e));
}

if (!msal) {
  // Config issue already rendered.
  // eslint-disable-next-line no-console
  console.warn('MSAL not configured; app bootstrap halted.');
} else {
  msal
    .initialize()
    .then(async () => {
      // Handle redirect promise to process authentication responses
      await msal.handleRedirectPromise();

      const accounts = msal.getAllAccounts();
      if (accounts.length > 0) {
        msal.setActiveAccount(accounts[0]);
      }

      msal.addEventCallback((_event: EventMessage) => {
        const accountsNow = msal.getAllAccounts();
        if (accountsNow.length > 0) {
          msal.setActiveAccount(accountsNow[0]);
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
            <MsalProvider instance={msal}>
              <AppProviders>
                <RouterProvider router={router} />
                {import.meta.env.DEV ? (
                  <TanStackRouterDevtools
                    router={router}
                    position="bottom-right"
                  />
                ) : null}
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
      renderBootstrapError(String((e as Error)?.message ?? e));
    });
}
