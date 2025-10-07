import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 1100;

export function useIsMobile() {
  const getIsMobile = () => (typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false);
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
