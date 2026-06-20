import { createFileRoute, redirect } from '@tanstack/react-router';

import { getAuthAdapter } from '@/platform/auth';
import { normalizeRedirectPath } from '@/platform/routing/normalizeRedirectPath';

export const Route = createFileRoute('/')({
  // After an interactive sign-in redirect (navigateToLoginRequestUrl is false),
  // MSAL lands the user back on '/'. Honour the return URL stored by signIn() so
  // reactive re-auth — and normal login — returns to the page the user came from
  // instead of always dumping them on the workspace root. Downstream /_protected
  // still guards auth, so a stale value is harmless (worst case: a bounce through
  // the guard back to /login).
  beforeLoad: () => {
    const stored = getAuthAdapter().getStoredRedirectUrl?.() ?? null;
    if (stored) {
      try {
        sessionStorage.removeItem('msalRedirectUrl');
      } catch {
        /* ignore */
      }
      throw redirect({ to: normalizeRedirectPath(stored, '/workspace') });
    }
    throw redirect({ to: '/workspace' });
  },
});
