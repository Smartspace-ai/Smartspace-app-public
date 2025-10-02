import { useEffect, useState } from 'react';

import { useTeams } from '@/contexts/teams-context';

/**
 * Custom hook to handle viewport height issues in Android Teams
 * Android Teams has different viewport behavior compared to iOS Teams
 */
export function useTeamsViewport() {
  const { isInTeams } = useTeams();
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [isAndroidTeams, setIsAndroidTeams] = useState(false);

  useEffect(() => {
    if (!isInTeams) {
      setViewportHeight('100vh');
      setIsAndroidTeams(false);
      return;
    }

    // Detect if we're running on Android Teams
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes('android');
    const isTeams = window.location.search.includes('inTeams=true') || 
                   (window as any).microsoftTeams !== undefined;
    
    const isAndroidTeamsDevice = isAndroid && isTeams;
    setIsAndroidTeams(isAndroidTeamsDevice);

    if (isAndroidTeamsDevice) {
      // For Android Teams, use a more reliable viewport height calculation
      const updateViewportHeight = () => {
        // Use window.innerHeight as fallback for Android Teams
        const height = window.innerHeight;
        setViewportHeight(`${height}px`);
      };

      // Set initial height
      updateViewportHeight();

      // Listen for orientation changes and resize events
      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', () => {
        // Delay to allow orientation change to complete
        setTimeout(updateViewportHeight, 100);
      });

      // Also listen for visual viewport changes if available
      if (window.visualViewport) {
        const handleVisualViewportChange = () => {
          const height = window.visualViewport?.height || window.innerHeight;
          setViewportHeight(`${height}px`);
        };

        window.visualViewport.addEventListener('resize', handleVisualViewportChange);
        
        return () => {
          window.removeEventListener('resize', updateViewportHeight);
          window.removeEventListener('orientationchange', updateViewportHeight);
          window.visualViewport?.removeEventListener('resize', handleVisualViewportChange);
        };
      }

      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
      };
    } else {
      // For iOS Teams and other platforms, use standard viewport units
      setViewportHeight('100vh');
    }
  }, [isInTeams]);

  return {
    viewportHeight,
    isAndroidTeams,
  };
}

