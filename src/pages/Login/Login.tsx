import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { isInTeams } from '@/platform/auth/msalConfig';
import { useAuth, useAuthRuntime } from '@/platform/auth/session';
import { ssInfo, ssWarn } from '@/platform/log';
import { normalizeRedirectPath } from '@/platform/routing/normalizeRedirectPath';

import { useTeams } from '@/app/providers';

import { Button } from '@/shared/ui/mui-compat/button';

import { Logo } from '@/assets/logo';

import styles from './Login.module.scss';

declare const __BUILD_TIME__: string;

export function Login({
  redirectTo,
  onNavigate,
}: {
  redirectTo?: string;
  onNavigate?: (to: string) => void;
}) {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const navigate = useNavigate();
  const {
    isTeamsInitialized,
    teamsUser,
    teamsContext,
    isInTeams: isInTeamsFromProvider,
  } = useTeams();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);

  // The route beforeLoad already handles "session+token exists → redirect away".
  // This component only renders when authentication IS needed.

  // Teams auto-login: one attempt after Teams SDK initializes
  useEffect(() => {
    if (
      !isInTeams() ||
      !isTeamsInitialized ||
      isLoading ||
      hasAttemptedAutoLogin
    ) {
      return;
    }

    setHasAttemptedAutoLogin(true);
    setIsLoading(true);
    setError(null);

    ssInfo('login', 'auto-attempting Teams sign-in', {
      isTeamsInitialized,
      teamsUser: teamsUser ?? null,
    });

    auth
      .signIn({ loginHint: teamsUser?.userPrincipalName })
      .then(() => {
        ssInfo('login', 'Teams auto-login succeeded -> navigate', {
          to: redirectTo,
        });
        onNavigate?.(redirectTo);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : 'Authentication failed';
        // interaction_in_progress means another MSAL flow hasn't fully cleared.
        // Don't show an error or retry (retrying opens a second popup).
        // Just stop loading so the user can click "Try again" when ready.
        if (msg.includes('interaction_in_progress')) {
          ssInfo(
            'login',
            'interaction_in_progress — waiting for MSAL to clear'
          );
          setIsLoading(false);
          return;
        }
        ssWarn('login', 'Teams auto-login failed', msg);
        setError(msg);
        setIsLoading(false);
      });
  }, [
    auth,
    isTeamsInitialized,
    isLoading,
    hasAttemptedAutoLogin,
    teamsUser,
    redirectTo,
    onNavigate,
  ]);

  // Fallback manual login for browser or if Teams SSO fails
  const handleManualLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await auth.signIn({ loginHint: teamsUser?.userPrincipalName });
      // For web auth (MSAL), signIn() performs a redirect, so we don't reach here
      // For Teams (popup), sign-in succeeded — navigate to the app
      onNavigate?.(redirectTo);
    } catch (authError: unknown) {
      setError(
        authError instanceof Error ? authError.message : 'Authentication failed'
      );
      setIsLoading(false);
      // eslint-disable-next-line no-console
      console.error('[Login] Manual login failed:', authError);
    }
  };

  const hasError = !!error;

  const getButtonText = () => {
    if (isLoading) {
      if (isInTeams()) {
        return teamsUser
          ? `Signing in as ${
              teamsUser.displayName || teamsUser.userPrincipalName
            }...`
          : 'Authenticating with Teams...';
      }
      return 'Signing in...';
    }

    if (hasError) return 'Try Again';
    return 'Sign in';
  };

  const getErrorMessage = () => {
    if (isInTeams()) {
      return (
        <div className="text-red-600 text-sm text-center max-w-sm">
          <div className="mb-2">
            Unable to sign in with your Teams account. This may be due to
            permission or configuration issues.
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

  // Teams diagnostics panel — hidden while sign-in popup is open
  const showTeamsErrorPanel = isInTeams() && hasError && !isLoading;
  const canShowDiag = showTeamsErrorPanel;

  const diag = {
    href: (() => {
      try {
        return window.location.href;
      } catch {
        return null;
      }
    })(),
    origin: (() => {
      try {
        return window.location.origin;
      } catch {
        return null;
      }
    })(),
    isInTeams_msalConfig: (() => {
      try {
        return isInTeams();
      } catch {
        return null;
      }
    })(),
    isInTeams_provider: isInTeamsFromProvider,
    isTeamsInitialized,
    teamsUser: teamsUser ?? null,
    teamsContextHasUser: !!(
      teamsContext &&
      typeof teamsContext === 'object' &&
      'user' in teamsContext
    ),
    lastAuthError: runtime.lastError,
    ssconfig: (() => {
      try {
        const w = window as unknown as Window & { ssconfig?: unknown };
        return w.ssconfig ?? null;
      } catch {
        return null;
      }
    })(),
    build: {
      mode: import.meta.env.MODE,
      sha:
        (import.meta.env as unknown as { VITE_BUILD_SHA?: string })
          ?.VITE_BUILD_SHA ?? null,
    },
  };

  const enableDebugAndReload = () => {
    try {
      localStorage.setItem('ss_debug', '1');
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.setItem('ss_debug', '1');
    } catch {
      /* ignore */
    }
    try {
      window.location.reload();
    } catch {
      /* ignore */
    }
  };

  const copyDiagnostics = async () => {
    const payload = {
      ...diag,
      ssLogs: (() => {
        try {
          const w = window as unknown as Window & { __ssLogs?: unknown };
          return w.__ssLogs ?? [];
        } catch {
          return [];
        }
      })(),
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setError((prev) => prev ?? 'Diagnostics copied to clipboard.');
    } catch {
      setError(
        (prev) =>
          prev ??
          'Unable to copy diagnostics (clipboard blocked). Please select/copy the diagnostics text below.'
      );
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
              <div className="text-sm text-gray-700 mb-1">
                Signing in with Teams…
              </div>
              {showTeamsErrorPanel && (
                <div className="mt-2 p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
                  <div className="font-semibold mb-1">Teams sign-in error</div>
                  {getErrorMessage()}
                  {canShowDiag ? (
                    <div className="mt-2">
                      <div className="flex gap-2 flex-wrap">
                        <Button onClick={handleManualLogin} className="text-xs">
                          Retry sign-in
                        </Button>
                        <Button
                          onClick={handleManualLogin}
                          disabled={isLoading}
                          className="text-xs"
                        >
                          {isLoading ? 'Signing in…' : 'Try again'}
                        </Button>
                        <Button
                          onClick={enableDebugAndReload}
                          className="text-xs"
                        >
                          Enable debug logs
                        </Button>
                        <Button onClick={copyDiagnostics} className="text-xs">
                          Copy diagnostics
                        </Button>
                      </div>
                      <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-red-900/90 max-h-[260px] overflow-auto">
                        {JSON.stringify(diag, null, 2)}
                      </pre>
                      <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-red-900/80 max-h-[260px] overflow-auto">
                        {JSON.stringify(
                          (() => {
                            try {
                              const w = window as unknown as Window & {
                                __ssLogs?: unknown;
                              };
                              return w.__ssLogs ?? [];
                            } catch {
                              return [];
                            }
                          })(),
                          null,
                          2
                        )}
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

          {/* Show error message only when not loading (hide while popup is open) */}
          {hasError && !isLoading && getErrorMessage()}
        </div>
      </div>
    </div>
  );
}

export default Login;
