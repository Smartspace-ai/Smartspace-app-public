import { msalInstance } from '@/platform/auth/msalClient';
import { isInTeams } from '@/platform/auth/msalConfig';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

function isWebAuthed() {
  return !!(msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0]);
}

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const authed = isInTeams() ? true /* optionally check Teams token */ : isWebAuthed();
    if (!authed) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
})

