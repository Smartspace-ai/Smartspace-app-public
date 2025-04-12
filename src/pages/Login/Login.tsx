import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../app/msalConfig';
import { Logo } from '../../assets/logo';
import { Button } from '../../components/ui/button';
import styles from './Login.module.scss';

export function Login() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  return (
    <div className={styles['container']}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col justify-center items-center p-8 bg-white shadow-md rounded-lg min-w-[300px]">
          <div className="login--logo p-10">
            <Logo></Logo>
          </div>
          <Button onClick={handleLogin} className="w-full text-lg">
            Sign in to your Smartspace
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Login;
