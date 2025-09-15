import { msalInstance } from '@/platform/auth/msalClient'
import { interactiveLoginRequest, isInTeams } from '@/platform/auth/msalConfig'
import { useTeamsAuth } from '@/platform/auth/use-teams-auth'
import { createFileRoute, redirect, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ location }) => {
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length > 0) {
      const params = new URLSearchParams(location.search ?? '')
      const target = params.get('redirect') || '/workspace'
      throw redirect({ to: target })
    }
  },
  component: Login,
})

function Login() {
  const search = useSearch({ from: '/login' }) as { redirect?: string };
  const { login: teamsLogin, isLoading, error } = useTeamsAuth();
  
  useEffect(() => {
    (async () => {
      if (isInTeams()) {
        await teamsLogin(); // hook handles redirect after success
      } else {
        await msalInstance.loginRedirect(interactiveLoginRequest);
      }
    })();
  }, []);
  
  return (
    <div className="flex h-screen items-center justify-center">
      {isLoading ? 'Signing you in…' : error ? `Auth error: ${String(error)}` : 'Starting login…'}
    </div>
  );
}

