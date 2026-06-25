// src/routes/__root.tsx
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { useEffect } from 'react';

import { removeSplash } from '@/platform/boot/removeSplash';
import type { RouterContext } from '@/platform/router/context';


import { RootErrorBoundary } from '@/app/ui/RouteErrorEnvelope';

import { useTeamsViewport } from '@/hooks/useTeamsViewport';

function RootContent() {
  const { viewportHeight, isAndroidTeams } = useTeamsViewport();

  // Remove the boot splash as soon as React mounts the root — not only when a
  // specific route's component commits. In the Teams web flow the router can sit
  // in the pending/beforeLoad phase (no route component mounts), which left the
  // z-9999 splash covering a fully-loaded app indefinitely.
  useEffect(() => {
    removeSplash();
  }, []);

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
