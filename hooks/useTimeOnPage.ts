import { useEffect, useRef } from 'react';

export interface TimeOnPageConfig {
  /** Function to call when reporting time on page */
  onTimeReport: (timeSpent: number) => void;
  /** Interval in milliseconds to report time (default: 30000 = 30 seconds) */
  reportInterval?: number;
  /** Whether to report time on page unmount (default: true) */
  reportOnUnmount?: boolean;
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook to track time spent on a page and report it at intervals
 * 
 * @param config - Configuration object for time tracking
 * 
 * @example
 * useTimeOnPage({
 *   onTimeReport: (timeSpent) => {
 *     analytics.track('time_on_page', { timeSpent });
 *   },
 *   reportInterval: 30000, // Report every 30 seconds
 * });
 */
export const useTimeOnPage = (config: TimeOnPageConfig) => {
  const {
    onTimeReport,
    reportInterval = 30000, // 30 seconds default
    reportOnUnmount = true,
    enabled = true,
  } = config;

  const startTimeRef = useRef<number>(Date.now());
  const lastReportTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasReportedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    // Reset start time when component mounts
    startTimeRef.current = Date.now();
    lastReportTimeRef.current = Date.now();
    hasReportedRef.current = false;

    // Set up interval reporting
    intervalRef.current = setInterval(() => {
      const currentTime = Date.now();
      const timeSpentSinceLastReport = currentTime - lastReportTimeRef.current;
      
      onTimeReport(timeSpentSinceLastReport);
      lastReportTimeRef.current = currentTime;
      hasReportedRef.current = true;
    }, reportInterval);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Report final time on unmount if enabled and we haven't reported yet
      if (reportOnUnmount) {
        const currentTime = Date.now();
        const finalTimeSpent = currentTime - lastReportTimeRef.current;
        
        // Only report if there's meaningful time spent (> 1 second)
        if (finalTimeSpent > 1000) {
          onTimeReport(finalTimeSpent);
        }
      }
    };
  }, [onTimeReport, reportInterval, reportOnUnmount, enabled]);

  // Return current time spent for manual access if needed
  const getCurrentTimeSpent = () => {
    return Date.now() - startTimeRef.current;
  };

  return {
    getCurrentTimeSpent,
    hasReported: hasReportedRef.current,
  };
};
