// src/main.tsx
import {
  AuthenticationResult,
  EventMessage,
  EventType,
} from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { getSmartSpaceChatAPI } from '@/platform/api/generated/chat/api';
import { getMsalInstance } from '@/platform/auth/msalClient'; // ✅ new path
import { queryClient } from '@/platform/reactQueryClient';

import AppProviders from '@/app/AppProviders';

import { NotFoundPage } from '@/routes/__root.notFound';
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
  context: {
    queryClient,
    api: getSmartSpaceChatAPI(),
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

// Popup guard: if this page loaded inside an MSAL popup (window.opener is set),
// do NOT render the full SPA. The parent window's MSAL instance monitors the
// popup URL, extracts the auth hash, and closes it. Rendering the SPA here
// causes the "full app in popup" and "double popup" bugs.
const isInPopup = (() => {
  try {
    return !!window.opener && window.opener !== window;
  } catch {
    return false;
  }
})();

if (isInPopup) {
  removeBootSplash();
  const rootEl = document.getElementById('root');
  if (rootEl) rootEl.textContent = 'Completing sign-in...';
  // eslint-disable-next-line no-console
  console.info('[SmartSpace] Popup context detected; SPA bootstrap skipped.');
} else {
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
}
