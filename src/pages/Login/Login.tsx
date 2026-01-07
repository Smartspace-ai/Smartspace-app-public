import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { isInTeams } from '@/platform/auth/msalConfig';
import { useAuth } from '@/platform/auth/session';
import { ssInfo, ssWarn } from '@/platform/log';

import { useTeams } from '@/app/providers';

import { Button } from '@/shared/ui/mui-compat/button';

import { Logo } from '@/assets/logo';

import styles from './Login.module.scss';

export function Login({ redirectTo = '/workspace' }: { redirectTo?: string }) {

  const auth = useAuth();
  const navigate = useNavigate();
  const { isTeamsInitialized, teamsUser, teamsContext, isInTeams: isInTeamsFromProvider } = useTeams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGenericError, setShowGenericError] = useState(false);
  const [session, setSession] = useState<{ accountId?: string; displayName?: string } | null>(null);
  // Check for existing session on mount
  useEffect(() => {
    if (isInTeams() && !isTeamsInitialized) return;
    const checkSession = async () => {
      try {
        ssInfo('login', 'checkSession start', {
          isInTeams_msalConfig: (() => { try { return isInTeams(); } catch { return null; } })(),
          isTeamsInitialized,
        });
        if (isInTeams()) {
          setIsLoading(true);
          setShowGenericError(false);
          setError(null);
        }
        const currentSession = await auth.getSession();
        // Only auto-navigate when we can also acquire a token silently.
        // Otherwise we can end up in a /login <-> /_protected redirect loop.
        if (currentSession) {
          try {
            await auth.getAccessToken({ silentOnly: true });
            setSession(currentSession);
            ssInfo('login', 'session+token OK -> navigate', { to: redirectTo });
            navigate({ to: redirectTo, replace: true });
            return;
          } catch (e) {
            // Treat as not signed in; user needs interactive sign-in.
            setSession(null);
            if (isInTeams()) {
              const msg = e instanceof Error ? e.message : String(e);
              ssWarn('login', 'token acquisition failed (Teams)', msg);
              setError(`Teams token acquisition failed: ${msg}`);
            }
          }
        } else {
          setSession(null);
          // If we got no session, try to acquire a token anyway so we can surface the real failure.
          if (isInTeams()) {
            try {
              await auth.getAccessToken({ silentOnly: true });
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              ssWarn('login', 'session missing; token acquisition failed (Teams)', msg);
              setError(`Teams session missing; token acquisition failed: ${msg}`);
            }
          }
        }
        if (isInTeams()) {
          setShowGenericError(true);
          setError((prev) => prev ?? 'Unable to sign in with your Teams account.');
          setIsLoading(false);
        }
      } catch (err) {
        ssWarn('login', 'checkSession threw', err);
        // No existing session, continue with login flow
        if (isInTeams()) {
          setShowGenericError(true);
          setError(err instanceof Error ? err.message : 'Unable to sign in with your Teams account.');
          setIsLoading(false);
        }
      }
    };
    checkSession();
  }, [auth, redirectTo, navigate, isTeamsInitialized]);

  // Avoid flashing the login UI if we already have a session
  if (session) {
    return null;
  }

  // Fallback manual login for browser or if Teams SSO fails
  const handleManualLogin = async () => {
    if (session) {
      navigate({ to: redirectTo, replace: true });
      return;
    }
    
    if (isLoading) {
      return;
    }
    
    setShowGenericError(false); // Clear previous errors
    setIsLoading(true);
    setError(null);
    
    try {
      await auth.signIn();
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
  const canShowDiag = showTeamsErrorPanel; // always show diagnostics when Teams sign-in fails

  const diag = {
    href: (() => { try { return window.location.href; } catch { return null; } })(),
    origin: (() => { try { return window.location.origin; } catch { return null; } })(),
    isInTeams_msalConfig: (() => { try { return isInTeams(); } catch { return null; } })(),
    isInTeams_provider: isInTeamsFromProvider,
    isTeamsInitialized,
    teamsUser: teamsUser ?? null,
    teamsContextHasUser: !!(teamsContext as any)?.user,
    lastTeamsAuthError: (() => { try { return (window as any).__teamsAuthLastError ?? null; } catch { return null; } })(),
    ssconfig: (() => { try { return (window as any)?.ssconfig ?? null; } catch { return null; } })(),
    build: {
      mode: import.meta.env.MODE,
      // Optional: set this in CI for easier “which build is deployed?” checks.
      sha: (import.meta as any)?.env?.VITE_BUILD_SHA ?? null,
    },
  };

  const enableDebugAndReload = () => {
    try { localStorage.setItem('ss_debug', '1'); } catch { /* ignore */ }
    try { sessionStorage.setItem('ss_debug', '1'); } catch { /* ignore */ }
    try { window.location.reload(); } catch { /* ignore */ }
  };

  const copyDiagnostics = async () => {
    const payload = {
      ...diag,
      ssLogs: (() => { try { return (window as any).__ssLogs ?? []; } catch { return []; } })(),
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      // Give lightweight feedback without adding new UI deps
      setError((prev) => prev ?? 'Diagnostics copied to clipboard.');
    } catch {
      // Clipboard may be blocked in some Teams contexts; fall back to showing text.
      setError((prev) => prev ?? 'Unable to copy diagnostics (clipboard blocked). Please select/copy the diagnostics text below.');
    }
  };

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
                  {canShowDiag ? (
                    <div className="mt-2">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={enableDebugAndReload}
                          className="text-xs"
                        >
                          Enable debug logs
                        </Button>
                        <Button
                          onClick={copyDiagnostics}
                          className="text-xs"
                        >
                          Copy diagnostics
                        </Button>
                      </div>
                      <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-red-900/90 max-h-[260px] overflow-auto">
{JSON.stringify(diag, null, 2)}
                      </pre>
                      <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-red-900/80 max-h-[260px] overflow-auto">
{JSON.stringify((() => { try { return (window as any).__ssLogs ?? []; } catch { return []; } })(), null, 2)}
                      </pre>
                    </div>
                  ) : null}
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
