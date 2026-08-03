import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { workspacesListOptions } from '@/domains/workspaces';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/mui-compat/card';

// Polled while this page stays mounted, so a user granted workspace access
// (e.g. via admin's access control tab) gets redirected automatically
// instead of being stuck here until they reload the tab.
const ACCESS_POLL_INTERVAL_MS = 15_000;

export default function NoWorkspacesAvailable() {
  const navigate = useNavigate();
  const { data: workspaces } = useQuery({
    ...workspacesListOptions(),
    refetchInterval: ACCESS_POLL_INTERVAL_MS,
  });

  useEffect(() => {
    if (workspaces?.length) {
      navigate({
        to: '/workspace/$workspaceId',
        params: { workspaceId: workspaces[0].id },
      });
    }
  }, [workspaces, navigate]);

  return (
    <div className="fixed inset-0 z-[1] flex items-center justify-center px-4">
      <Card className="w-full max-w-lg rounded-2xl shadow-xl">
        <CardHeader className="items-center text-center space-y-4 px-6 pt-10 pb-16">
          <CardTitle className="text-2xl md:text-3xl text-gray-700 dark:text-gray-200">
            No Workspaces Available
          </CardTitle>
          <CardDescription className="text-sm md:text-base max-w-md mx-auto text-gray-500 dark:text-gray-400">
            It looks like you don't have access to any workspaces yet. Please
            contact your administrator to get access to a workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 text-[11px] text-gray-600 dark:text-gray-300"></CardContent>
      </Card>
    </div>
  );
}
