// src/main.tsx
import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'

import { EventMessage } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './domains/auth/msalClient'

import { ErrorBoundary } from 'react-error-boundary'

import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

function fallbackRender({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
}

// Create the router once
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// ✅ Initialize MSAL first
msalInstance.initialize().then(() => {
  // Set an active account immediately if present
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0])
  }

  // 🔁 Keep active account up to date on login success
  msalInstance.addEventCallback((event: EventMessage) => {
    const accountsNow = msalInstance.getAllAccounts()
    if (accountsNow.length > 0) {
      msalInstance.setActiveAccount(accountsNow[0])
    }
  })

  const rootElement =
    (document.getElementById('root') as HTMLElement) ??
    document.body.appendChild(document.createElement('div'))
  rootElement.id = 'root'

  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <ErrorBoundary fallbackRender={fallbackRender}>
        <MsalProvider instance={msalInstance}>
          <RouterProvider router={router} />
        </MsalProvider>
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
    </StrictMode>,
  )
})
