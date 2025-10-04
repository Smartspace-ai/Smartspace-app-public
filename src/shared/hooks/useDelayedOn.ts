// shared/hooks/useDelayedOn.ts
import { useEffect, useState } from 'react';

export function useDelayedOn(active: boolean, delayMs = 250) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) { setOn(false); return; }
    const t = setTimeout(() => setOn(true), delayMs);
    return () => clearTimeout(t);
  }, [active, delayMs]);
  return on;
}
