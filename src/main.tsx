// src/main.tsx
import {
  AuthenticationResult,
  EventMessage,
  EventType,
} from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { ChatApi } from '@smartspace/api-client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { configureApiClient } from '@/platform/api/configureApiClient';
import { getMsalInstance } from '@/platform/auth/msalClient';
import { removeSplash } from '@/platform/boot/removeSplash';
import { ssError, ssInfoAlways, ssWarn } from '@/platform/log';
import { queryClient } from '@/platform/reactQueryClient';

import AppProviders from '@/app/AppProviders';

import { NotFoundPage } from '@/routes/__root.notFound';
import { routeTree } from '@/routeTree.gen';

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

function fallbackRender({ error }: { error: unknown }) {
  removeSplash();
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{message}</pre>
    </div>
  );
}

// Must run before any ChatApi / AXIOS_INSTANCE usage (e.g. router context below).
configureApiClient();

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    api: ChatApi.getSmartSpaceChatAPI(),
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultNotFoundComponent: ({ data }) => <NotFoundPage data={data} />,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Popup guard: if this page loaded inside an MSAL popup (window.opener is set
// AND the URL contains an auth response hash), do NOT render the full SPA.
// The parent window's MSAL instance monitors the popup URL, extracts the auth
// hash, and closes it. Rendering the SPA here causes the "full app in popup"
// and "double popup" bugs.
// We require an auth hash so that normal window.open(...) links (e.g. from the
// admin portal) don't accidentally skip the entire app.
const isInPopup = (() => {
  try {
    const hasOpener = !!window.opener && window.opener !== window;
    const hasAuthHash =
      window.location.hash.includes('code=') ||
      window.location.hash.includes('error=');
    return hasOpener && hasAuthHash;
  } catch {
    return false;
  }
})();

if (isInPopup) {
  removeSplash();
  const rootEl = document.getElementById('root');
  if (rootEl) rootEl.textContent = 'Completing sign-in...';
  ssInfoAlways('boot', 'Popup context detected; SPA bootstrap skipped.');
} else {
  let msal: ReturnType<typeof getMsalInstance> | null = null;
  try {
    msal = getMsalInstance();
  } catch (e) {
    // Don't leave users stuck on an infinite splash screen.
    removeSplash();
    ssError('boot', 'MSAL config error', e);
    renderBootstrapError(String((e as Error)?.message ?? e));
  }

  if (!msal) {
    // Config issue already rendered.
    ssWarn('boot', 'MSAL not configured; app bootstrap halted.');
  } else {
    msal
      .initialize()
      .then(async () => {
        // Handle redirect promise to process authentication responses.
        // IMPORTANT: Use the result to set the correct active account —
        // with multiple cached accounts, accounts[0] may be stale.
        const redirectResult = await msal.handleRedirectPromise();

        if (redirectResult?.account) {
          // Redirect just completed — use the authenticated account
          msal.setActiveAccount(redirectResult.account);
        } else {
          // Normal page load (no redirect) — pick existing account
          const accounts = msal.getAllAccounts();
          if (accounts.length > 0) {
            msal.setActiveAccount(accounts[0]);
          }
        }

        // Update active account only on successful auth events (not every event),
        // using the event payload to avoid blindly picking accounts[0].
        msal.addEventCallback((event: EventMessage) => {
          if (
            event.eventType === EventType.LOGIN_SUCCESS ||
            event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
            event.eventType === EventType.SSO_SILENT_SUCCESS
          ) {
            const payload = event.payload as AuthenticationResult | null;
            if (payload?.account) {
              msal.setActiveAccount(payload.account);
            }
          }
        });

        const rootElement =
          (document.getElementById('root') as HTMLElement) ??
          document.body.appendChild(document.createElement('div'));
        rootElement.id = 'root';

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
        removeSplash();
        ssError('boot', 'MSAL initialization failed', e);
        renderBootstrapError(String((e as Error)?.message ?? e));
      });
  }
}
