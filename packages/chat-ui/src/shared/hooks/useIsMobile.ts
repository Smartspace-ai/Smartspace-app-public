import { useEffect, useState } from 'react';

/**
 * Single source of truth for the "mobile layout" cutoff. Exported so the host
 * app's sidebar doesn't keep its own copy — the two drifting apart would put
 * the rails and the chat body on different notions of mobile.
 *
 * Note this is deliberately wider than Tailwind's `lg` (1024px): everything
 * below it currently gets overlay rails, including iPad landscape. Whether
 * that's the right cutoff is a product decision, not a layout bug.
 */
export const MOBILE_BREAKPOINT = 1100;

export function useIsMobile() {
  const getIsMobile = () =>
    typeof window !== 'undefined'
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false;
  const [isMobile, setIsMobile] = useState<boolean>(getIsMobile());

  // Listen for window size changes
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
