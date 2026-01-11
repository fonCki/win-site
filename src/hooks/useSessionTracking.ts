import { useEffect, useRef } from 'react';
import { logVisit, logSessionEnd, getIP } from '../services/analyticsService';

/**
 * Hook to track user session duration and log visit/session events
 * - Logs visit event on mount
 * - Logs session end event on page unload with duration
 */
export const useSessionTracking = () => {
  const sessionStartRef = useRef<number>(Date.now());
  const hasLoggedVisitRef = useRef(false);

  useEffect(() => {
    // Log visit on first mount (only once)
    if (!hasLoggedVisitRef.current) {
      hasLoggedVisitRef.current = true;
      // Pre-fetch IP to ensure it's cached for session end
      getIP();
      logVisit();
    }

    // Handle session end on page unload
    const handleBeforeUnload = () => {
      const duration = Date.now() - sessionStartRef.current;
      logSessionEnd(duration);
    };

    // Handle visibility change (tab hidden = potential session end)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const duration = Date.now() - sessionStartRef.current;
        logSessionEnd(duration);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    getSessionDuration: () => Date.now() - sessionStartRef.current,
  };
};

export default useSessionTracking;
