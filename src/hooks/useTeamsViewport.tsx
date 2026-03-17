// src/app/hooks/useTeamsViewport.ts
import { useEffect, useState } from 'react';

import { useTeams } from '@/app/providers';

export function useTeamsViewport() {
  const { isInTeams } = useTeams();
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const [isAndroidTeams, setIsAndroidTeams] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      setViewportHeight('100dvh');
      setIsAndroidTeams(false);
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const androidTeams = isInTeams && ua.includes('android');
    setIsAndroidTeams(androidTeams);

    const apply = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      setViewportHeight(`${h}px`);
    };

    if (!androidTeams) {
      setViewportHeight('100dvh');
      return;
    }

    apply();

    let raf = 0;
    const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };
    const onOrient = () => setTimeout(apply, 100);

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrient);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrient);
      vv?.removeEventListener('resize', onResize);
    };
  }, [isInTeams]);

  return { viewportHeight, isAndroidTeams };
}
