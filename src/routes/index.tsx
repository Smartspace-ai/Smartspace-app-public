import { Navigate, createFileRoute } from '@tanstack/react-router';

import { isInTeams } from '@/platform/auth/utils';

export const Route = createFileRoute('/')({
  component: () => {
    const teamsFailed = (() => {
      try { return sessionStorage.getItem('teamsAuthFailed') === '1'; } catch { return false; }
    })();

    if (isInTeams() && teamsFailed) {
      return <Navigate to="/auth-failed" search={{ redirect: '/workspace' }} replace />;
    }

    return <Navigate to="/workspace" replace />;
  },
})

