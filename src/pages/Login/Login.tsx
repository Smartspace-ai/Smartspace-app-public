import { useMsal } from '@azure/msal-react';
import { useEffect, useState } from 'react';
import { interactiveLoginRequest } from '../../app/msalConfig';
import { Logo } from '../../assets/logo';
import { Button } from '../../components/ui/button';
import { useTeams } from '../../contexts/teams-context';
import { useTeamsAuth } from '../../hooks/use-teams-auth';
import styles from './Login.module.scss';

export function Login() {
  const { instance, accounts } = useMsal();
  const { login, isLoading, error, isInTeams } = useTeamsAuth();
  const { isTeamsInitialized, teamsUser } = useTeams();
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);
  const [showGenericError, setShowGenericError] = useState(false);

  // Auto-attempt Teams authentication when in Teams (only once)
  useEffect(() => {
    if (isInTeams && isTeamsInitialized && accounts.length === 0 && !isLoading && !hasAttemptedAutoLogin) {
      setHasAttemptedAutoLogin(true);
      login().catch(() => {
        // If auto-login fails, show generic error and allow manual retry
        setShowGenericError(true);
      });
    }
  }, [isInTeams, isTeamsInitialized, isLoading, hasAttemptedAutoLogin, login, accounts.length]);

  // Show generic error when there's an authentication error
  useEffect(() => {
    if (error) {
      setShowGenericError(true);
    }
  }, [error]);

  // Fallback manual login for browser or if Teams SSO fails
  const handleManualLogin = async () => {
    setShowGenericError(false); // Clear previous errors
    
    try {
      if (isInTeams) {
        await login(); // Teams auto/popup flow
      } else {
        await instance.loginRedirect(interactiveLoginRequest);
      }
    } catch (authError) {
      // Show generic error on failure
      setShowGenericError(true);
      console.error('Manual login failed:', authError);
    }
  };

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

  return (
    <div className={`ss-login ${styles['container']}`}>
      {/* Full-screen centered container with light gray background */}
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {/* Card container for the login form */}
        <div className="flex flex-col justify-center items-center p-8 bg-white shadow-md rounded-lg min-w-[300px] max-w-[400px]">
          {/* App logo */}
          <div className="login--logo p-10">
            <Logo />
          </div>

          {/* Always show login button */}
          {
            isInTeams?
            <div>
              Signing in with Teams...
            </div>
            :
            <Button 
              onClick={handleManualLogin} 
              disabled={isLoading}
              className="w-full text-lg mb-4"
            >
              {getButtonText()}
            </Button>
          }

          {/* Show generic error message when authentication fails */}
          {(showGenericError || error) && !isLoading && (
            getErrorMessage()
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
