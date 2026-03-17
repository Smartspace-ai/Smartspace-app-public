// src/routes/__root.tsx
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';

import type { RouterContext } from '@/platform/router/context';

import { RootErrorBoundary } from '@/app/ui/RouteErrorEnvelope';

import { useTeamsViewport } from '@/hooks/useTeamsViewport';

function RootContent() {
  const { viewportHeight, isAndroidTeams } = useTeamsViewport();

  return (
    <div
      className="flex flex-col"
      style={{
        minHeight: viewportHeight,
        ...(isAndroidTeams && {
          height: viewportHeight,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }),
      }}
    >
      <Outlet />
    </div>
  );
}

export default function Root() {
  return <RootContent />;
}
// routes/__root.tsx
export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
  errorComponent: RootErrorBoundary,
});
