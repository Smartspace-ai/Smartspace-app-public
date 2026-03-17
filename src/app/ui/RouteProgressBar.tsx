// src/app/ui/RouteProgressBar.tsx
import { useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export function RouteProgressBar() {
  const busy = useRouterState({ select: s => s.isLoading || s.isTransitioning });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!busy) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), 200); // delay to avoid flicker
    return () => clearTimeout(t);
  }, [busy]);

  return show ? (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-primary/70 animate-pulse" />
  ) : null;
}
