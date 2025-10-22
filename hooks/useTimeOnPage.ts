import { useEffect, useRef, useMemo } from 'react';

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export interface TimeOnPageConfig {
  /** Function to call when reporting time on page */
  onTimeReport: (timeSpent: number, sessionId: string) => void;
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
 *   onTimeReport: (timeSpent, sessionId) => {
 *     analytics.track('time_on_page', { timeSpent, sessionId });
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

  // Generate unique session ID on mount (only once)
  const sessionId = useMemo(() => generateSessionId(), []);

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

      onTimeReport(timeSpentSinceLastReport, sessionId);
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
          onTimeReport(finalTimeSpent, sessionId);
        }
      }
    };
  }, [onTimeReport, reportInterval, reportOnUnmount, enabled, sessionId]);

  // Return current time spent for manual access if needed
  const getCurrentTimeSpent = () => {
    return Date.now() - startTimeRef.current;
  };

  return {
    getCurrentTimeSpent,
    hasReported: hasReportedRef.current,
    sessionId,
  };
};
