// src/main.tsx
import { EventMessage, EventType } from '@azure/msal-browser';
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
    const redirectResult = await msalInstance.handleRedirectPromise();

    const setActive = (account: any) => {
      msalInstance.setActiveAccount(account);
      try {
        // Helps pick the right account on next load when multiple accounts are cached.
        const id = account?.homeAccountId;
        if (typeof id === 'string' && id.length) localStorage.setItem('msalActiveHomeAccountId', id);
      } catch {
        // ignore storage failures
      }
    };

    // Prefer the account returned from redirect (most accurate), otherwise fall back.
    if (redirectResult?.account) {
      setActive(redirectResult.account);
    } else {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
        let preferred: any = null;
        try {
          const saved = localStorage.getItem('msalActiveHomeAccountId');
          preferred = saved ? accounts.find(a => a.homeAccountId === saved) : null;
        } catch {
          preferred = null;
        }
        setActive(preferred ?? accounts[0]);
      }
    }

    msalInstance.addEventCallback((event: EventMessage) => {
      // Only update active account on events that actually carry an account.
      // Avoid clobbering active account to "accounts[0]" when multiple accounts are cached.
      if (
        event.eventType === EventType.LOGIN_SUCCESS ||
        event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
        event.eventType === EventType.SSO_SILENT_SUCCESS
      ) {
        const payload = event.payload as { account?: unknown } | null;
        const account = (payload && typeof payload === 'object' && 'account' in payload)
          ? (payload as any).account
          : null;
        if (account) setActive(account);
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
