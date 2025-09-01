import { useTeamsAuth } from '@/domains/auth/use-teams-auth';
import { useMsal } from '@azure/msal-react';
import { useEffect, useState } from 'react';
import { interactiveLoginRequest } from '../../app/msalConfig';
import { Logo } from '../../assets/logo';
import { Button } from '../../components/ui/button';
import { useTeams } from '../../contexts/teams-context';
import styles from './Login.module.scss';

export function Login() {
  // Grab intended redirect path from URL if present
  const redirectParam = new URLSearchParams(window.location.search).get('redirect') ?? '/';

  const { instance, accounts, inProgress } = useMsal();
  const { login, isLoading, error, isInTeams, isAuthenticated } = useTeamsAuth();
  // Debug removed for production
  let persistedToken: string | null = null
  try {
    persistedToken = sessionStorage.getItem('teamsAuthToken')
  } catch (_e) { /* ignore */ }
  // Teams should auto-login (desktop and mobile)
  const { isTeamsInitialized, teamsUser } = useTeams();
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);
  const [showGenericError, setShowGenericError] = useState(false);
  // Compute redirect at use site only; helper removed
  // Show generic error when there's an authentication error
  useEffect(() => {
    if (error) {
      setShowGenericError(true);
    }
  }, [error]);

  // Auto-attempt Teams authentication (desktop and mobile)
  useEffect(() => {
    if (isInTeams && isTeamsInitialized && !isLoading && !hasAttemptedAutoLogin) {
      setHasAttemptedAutoLogin(true)
      login().catch(() => {
        setShowGenericError(true)
      })
    }
  }, [isInTeams, isTeamsInitialized, isLoading, hasAttemptedAutoLogin, login])

  // Auto-redirect when authenticated (Teams or Web)
  useEffect(() => {
    if (isInTeams && (isAuthenticated || persistedToken)) {
      window.location.replace(redirectParam)
      return
    }
    if (!isInTeams && accounts.length > 0 && inProgress === 'none') {
      window.location.replace(redirectParam)
    }
  }, [accounts.length, inProgress, redirectParam, isAuthenticated, isInTeams, persistedToken]);

  // Avoid flashing the login UI while MSAL is handling redirect or we already have an account
  // In Teams, keep the UI visible so we can surface detailed errors on mobile
  if (!isInTeams && (accounts.length > 0 || inProgress !== 'none')) {
    return null;
  }


  // Fallback manual login for browser or if Teams SSO fails
  const handleManualLogin = async () => {
    if (accounts.length > 0) {
      window.location.replace(redirectParam)
      return
    }
    // Log state for debugging
    // eslint-disable-next-line no-console
    const busy = inProgress !== 'none'
    if (busy) {
      return;
    }
    setShowGenericError(false); // Clear previous errors
    
    try {
      if (isInTeams) {
        await login(); // Use Teams-aware login with login hints
      } else {
        await instance.loginRedirect({
          ...interactiveLoginRequest,
        });
      }
    } catch (authError) {
      // Show generic error on failure
      setShowGenericError(true);
      // eslint-disable-next-line no-console
      console.error('[Login] Manual login failed:', authError);
    }
  };

  // Teams auto-login; no manual handlers needed

  const getButtonText = () => {
    if (isLoading) {
      if (isInTeams) {
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
    if (isInTeams) {
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
  const showTeamsErrorPanel = isInTeams && (showGenericError || !!error)

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
          {isInTeams ? (
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
              disabled={isLoading || inProgress !== 'none'}
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
