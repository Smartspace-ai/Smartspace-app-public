import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../app/msalConfig';
import { Logo } from '../../assets/logo';
import { Button } from '../../components/ui/button';
import styles from './Login.module.scss';

export function Login() {
  const { instance } = useMsal();

  // Initiates redirect login flow using MSAL configuration
  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
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

          {/* Login button triggers MSAL login redirect */}
          <Button onClick={handleLogin} className="w-full text-lg">
            Sign in to your Smartspace
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Login;
