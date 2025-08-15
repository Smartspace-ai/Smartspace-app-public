import { MsalProvider } from '@azure/msal-react';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import App from './app/app';
import { msalInstance } from './auth/msalClient';

// 🔑 MSAL instance is created in auth/msalClient.ts

async function bootstrap() {
  await msalInstance.initialize();
  const result = await msalInstance.handleRedirectPromise();
  if (result?.account) {
    msalInstance.setActiveAccount(result.account);
  } else {
    const accts = msalInstance.getAllAccounts();
    if (accts.length === 1) {
      msalInstance.setActiveAccount(accts[0]);
    }
  }

  const rootElement =
    (document.getElementById('root') as HTMLElement) ??
    document.body.appendChild(document.createElement('div'));
  rootElement.id = 'root';

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>
  );
}

bootstrap();