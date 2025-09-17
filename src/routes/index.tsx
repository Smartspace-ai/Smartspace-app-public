import { Navigate, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: () => {
    // Check if we have a stored redirect URL from MSAL login
    const storedRedirect = sessionStorage.getItem('msalRedirectUrl');
    if (storedRedirect) {
      sessionStorage.removeItem('msalRedirectUrl');
      return <Navigate to={storedRedirect} replace />;
    }
    return <Navigate to="/workspace" replace />;
  },
})

