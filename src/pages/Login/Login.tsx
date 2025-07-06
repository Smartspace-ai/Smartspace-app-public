import { useMsal } from '@azure/msal-react';
import { useEffect, useState } from 'react';
import { loginRequest } from '../../app/msalConfig';
import { Logo } from '../../assets/logo';
import { Button } from '../../components/ui/button';
import { useTeams } from '../../contexts/teams-context';
import { useTeamsAuth } from '../../hooks/use-teams-auth';
import styles from './Login.module.scss';

export function Login() {
  const { instance } = useMsal();
  const { login, isLoading, error, isInTeams, resetRetryCount, retryCount } = useTeamsAuth();
  const { isTeamsInitialized } = useTeams();
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);

  // Auto-attempt Teams authentication when in Teams (only once)
  useEffect(() => {
    if (isInTeams && isTeamsInitialized && !isLoading && !hasAttemptedAutoLogin) {
      setHasAttemptedAutoLogin(true);
      login();
    }
  }, [isInTeams, isTeamsInitialized, isLoading, hasAttemptedAutoLogin, login]);

  // Fallback manual login for browser or if Teams SSO fails
  const handleManualLogin = () => {
    resetRetryCount(); // Reset retry count for manual attempts
    if (isInTeams) {
      login(); // Use Teams-aware login
    } else {
      instance.loginPopup(loginRequest);
    }
  };

  return (
    <div className={`ss-login ${styles['container']}`}>
      {/* Full-screen centered container with light gray background */}
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {/* Card container for the login form */}
        <div className="flex flex-col justify-center items-center p-8 bg-white shadow-md rounded-lg min-w-[300px]">
          {/* App logo */}
          <div className="login--logo p-10">
            <Logo />
          </div>

          {/* Teams: Only show spinner or error, never the login button */}
          {isInTeams ? (
            isLoading ? (
              <Button disabled className="w-full text-lg">
                {'Authenticating with Teams...'}
              </Button>
            ) : error ? (
              <div className="text-red-600 text-sm mt-2 text-center max-w-sm">
                <div className="mb-2">{error}</div>
                {retryCount >= 2 && (
                  <div className="text-xs text-gray-600">
                    Try refreshing the page or contact your IT administrator if this persists.
                  </div>
                )}
              </div>
            ) : (
              // If not loading and no error, show nothing (Teams SSO should be seamless)
              <div style={{ height: '40px' }} />
            )
          ) : (
            // Browser: Show login button or spinner
            isLoading ? (
              <Button disabled className="w-full text-lg">
                {'Signing in...'}
              </Button>
            ) : (
              <Button onClick={handleManualLogin} className="w-full text-lg">
                {'Sign in to your Smartspace'}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
