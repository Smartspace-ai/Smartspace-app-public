import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { isInTeams } from '@/platform/auth/msalConfig';
import { useAuth } from '@/platform/auth/session';

import { useTeams } from '@/app/providers';

import { Button } from '@/shared/ui/mui-compat/button';

import { Logo } from '@/assets/logo';

import styles from './Login.module.scss';

export function Login() {
  // Grab intended redirect path from URL if present
  const redirectParam = new URLSearchParams(window.location.search).get('redirect') ?? '/workspace';

  const auth = useAuth();
  const navigate = useNavigate();
  const { isTeamsInitialized, teamsUser } = useTeams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGenericError, setShowGenericError] = useState(false);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);
  const [session, setSession] = useState<{ accountId?: string; displayName?: string } | null>(null);
  const [hasValidToken, setHasValidToken] = useState(false);
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentSession = await auth.adapter.getSession();
        setSession(currentSession);
        if (currentSession) {
          // Same as route guard: only auto-navigate if we can also silently acquire a token.
          // Otherwise we'd bounce /login -> /_protected -> /login forever in environments
          // where an account is cached but silent token acquisition fails.
          try {
            await auth.adapter.getAccessToken({ silentOnly: true });
            setHasValidToken(true);
            navigate({ to: redirectParam, replace: true });
          } catch {
            setHasValidToken(false);
            // stay on the login page; user can click "Sign in" to trigger interactive flow
          }
        } else {
          setHasValidToken(false);
        }
      } catch (err) {
        // No existing session, continue with login flow
      }
    };
    checkSession();
  }, [auth, redirectParam, navigate]);

  // Auto-attempt Teams authentication (desktop and mobile)
  useEffect(() => {
    if (isInTeams() && isTeamsInitialized && !isLoading && !hasAttemptedAutoLogin && !session) {
      setHasAttemptedAutoLogin(true);
      setIsLoading(true);
      setError(null);
      
      auth.adapter.signIn().then(() => {
        // After successful Teams sign in, navigate to the redirect URL
        navigate({ to: redirectParam, replace: true });
      }).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setShowGenericError(true);
        setIsLoading(false);
      });
    }
  }, [isTeamsInitialized, isLoading, hasAttemptedAutoLogin, session, auth, navigate, redirectParam]);

  // Avoid flashing the login UI only if we *know* we're able to continue (token ok) and navigation will occur.
  // If a session exists but token acquisition fails, we must still show the login UI (otherwise it's a blank page).
  if (session && hasValidToken) {
    return null;
  }

  // Fallback manual login for browser or if Teams SSO fails
  const handleManualLogin = async () => {
    if (session && hasValidToken) {
      navigate({ to: redirectParam, replace: true });
      return;
    }
    
    if (isLoading) {
      return;
    }
    
    setShowGenericError(false); // Clear previous errors
    setIsLoading(true);
    setError(null);
    
    try {
      await auth.adapter.signIn();
      // For web auth (MSAL), signIn() performs a redirect, so we don't navigate here
      // For Teams auth, the redirect will be handled by the auto-login effect
    } catch (authError: unknown) {
      // Show generic error on failure
      setError(authError instanceof Error ? authError.message : 'Authentication failed');
      setShowGenericError(true);
      setIsLoading(false);
      // eslint-disable-next-line no-console
      console.error('[Login] Manual login failed:', authError);
    }
  };

  // Teams auto-login; no manual handlers needed

  const getButtonText = () => {
    if (isLoading) {
      if (isInTeams()) {
        return teamsUser ? 
          `Signing in as ${teamsUser.displayName || teamsUser.userPrincipalName}...` : 
          'Authenticating with Teams...';
      }
      return 'Signing in...';
    }
    
    if (showGenericError || error) {
      return 'Try Again';
    }
    
    return 'Sign in';
  };

  const getErrorMessage = () => {
    if (isInTeams()) {
      return (
        <div className="text-red-600 text-sm text-center max-w-sm">
          <div className="mb-2">
            Unable to sign in with your Teams account. This may be due to permission or configuration issues.
          </div>
          {error}
          <div className="text-xs text-gray-600">
            Please contact your IT administrator if this issue persists.
          </div>
        </div>
      );
    }

    if (session && !hasValidToken) {
      return (
        <div className="text-red-600 text-sm text-center max-w-sm">
          <div className="mb-2">
            You appear to be signed in, but we couldn’t obtain an access token silently. Please sign in again.
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-red-600 text-sm text-center max-w-sm">
        <div className="mb-2">
          Something went wrong during sign-in. Please try again.
        </div>
        <div className="text-xs text-gray-600">
          If this issue persists, please contact your IT administrator.
        </div>
      </div>
    );
  };

  // Diagnostics removed for production

  // Prominent Teams error panel content
  const showTeamsErrorPanel = isInTeams() && (showGenericError || !!error);

  return (
    <div className={`ss-login ${styles['container']}`}>
      {/* Guaranteed full-viewport container regardless of surrounding layout */}
      <div className="fixed inset-0 z-[1000] w-screen h-screen flex items-center justify-center bg-gray-100">
        {/* Card container for the login form */}
        <div className="flex flex-col justify-center items-center p-8 bg-white shadow-md rounded-lg min-w-[300px] max-w-[400px]">
          {/* App logo */}
          <div className="login--logo p-10">
            <Logo />
          </div>

          {/* Login controls */}
          {isInTeams() ? (
            <div className="w-full flex flex-col items-stretch gap-2">
              <div className="text-sm text-gray-700 mb-1">Signing in with Teams…</div>
              {showTeamsErrorPanel && (
                <div className="mt-2 p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
                  <div className="font-semibold mb-1">Teams sign-in error</div>
                  {getErrorMessage()}
                </div>
              )}
            </div>
          ) : (
            <Button 
              onClick={handleManualLogin} 
              disabled={isLoading}
              className="w-full text-lg mb-4"
            >
              {getButtonText()}
            </Button>
          )}

          {/* Show error message even while loading to surface Teams/MSAL details on mobile */}
          {(showGenericError || error) && (
            getErrorMessage()
          )}

          {/* Diagnostics removed for production */}
        </div>
      </div>
    </div>
  );
}

export default Login;
