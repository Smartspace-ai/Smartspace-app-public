// Root-level re-auth prompt for Teams (and any context where interactive
// sign-in needs a user gesture). On pure web, handleSessionExpired() redirects
// automatically and this never shows. In Teams, opening the auth popup requires
// a click, so we surface a blocking prompt whose button drives signIn().
//
// Styles are intentionally inline raw values, not theme tokens: this overlay is
// the last-resort UI when the session (and often the rest of the app's data) is
// broken, so it must not depend on theme context being healthy.
/* eslint-disable no-restricted-syntax -- intentional theme-independent styles */
import { useState } from 'react';

import { useAuth, useAuthRuntime } from '@/platform/auth/session';
import { resetSessionExpiry } from '@/platform/auth/sessionExpiry';
import { SESSION_QUERY_KEY } from '@/platform/auth/sessionQuery';
import { ssWarn } from '@/platform/log';
import { queryClient } from '@/platform/reactQueryClient';

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2147483647,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.45)',
};

const card: React.CSSProperties = {
  background: '#fff',
  color: '#1a1a1a',
  borderRadius: 12,
  padding: '24px 28px',
  maxWidth: 360,
  textAlign: 'center',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
  fontFamily: 'inherit',
};

const button: React.CSSProperties = {
  marginTop: 16,
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  background: '#5b5bd6',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};

export function SessionExpiryPrompt() {
  const adapter = useAuth();
  const { sessionExpired, authStuck } = useAuthRuntime();
  const [signingIn, setSigningIn] = useState(false);

  // authStuck (re-auth looped without resolving) is terminal and takes
  // precedence over the ordinary Teams gesture prompt.
  if (!sessionExpired && !authStuck) return null;

  const onSignIn = async () => {
    setSigningIn(true);
    // Clear flags + attempt budget before retrying so the redirect starts
    // fresh (signIn() navigates away on web, so post-call cleanup won't run).
    resetSessionExpiry();
    try {
      await adapter.signIn();
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    } catch (e) {
      ssWarn('auth', 'sign-in from session-expiry prompt failed', e);
      setSigningIn(false);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={authStuck ? 'Unable to sign in' : 'Session expired'}
      style={overlay}
    >
      <div style={card}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>
          {authStuck ? "We couldn't sign you in" : 'Session expired'}
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          {authStuck
            ? 'Signing in didn’t resolve the problem. Try again, or contact your administrator if it keeps happening.'
            : 'Your session timed out. Sign in again to keep working.'}
        </p>
        <button
          type="button"
          onClick={() => void onSignIn()}
          disabled={signingIn}
          style={{ ...button, opacity: signingIn ? 0.6 : 1 }}
        >
          {signingIn ? 'Signing in…' : 'Try again'}
        </button>
      </div>
    </div>
  );
}
