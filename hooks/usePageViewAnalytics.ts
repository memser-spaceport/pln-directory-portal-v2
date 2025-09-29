import { useEffect, useRef } from 'react';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';

export interface PageViewAnalyticsConfig {
  /** PostHog event function to call */
  postHogEventFunction?: () => void;
  /** Custom analytics event name */
  customEventName: string;
  /** Current page path */
  path: string;
  /** Additional properties to include in the analytics event */
  additionalProperties?: Record<string, any>;
  /** Whether to require user authentication (default: true) */
  requireAuth?: boolean;
  /** Custom distinct ID (if not provided, uses userInfo.email) */
  distinctId?: string;
}

/**
 * Reusable hook for reporting page view analytics
 * Ensures the event is triggered only once on component mount
 * 
 * @param config - Configuration object for the page view analytics
 * 
 * @example
 * // Basic usage
 * usePageViewAnalytics({
 *   postHogEventFunction: onFounderPendingViewPageOpened,
 *   customEventName: 'founder_pending_view_page_opened',
 *   path: '/demoday',
 * });
 * 
 * @example
 * // With additional properties
 * usePageViewAnalytics({
 *   postHogEventFunction: onInvestorProfilePageOpened,
 *   customEventName: 'investor_profile_page_opened',
 *   path: `/members/${memberId}`,
 *   additionalProperties: {
 *     hasInvestorProfile: !!profile?.type,
 *     profileType: profile?.type,
 *     isComplete: isProfileComplete,
 *   },
 * });
 * 
 * @example
 * // Without authentication requirement
 * usePageViewAnalytics({
 *   customEventName: 'public_page_viewed',
 *   path: '/public-demo',
 *   requireAuth: false,
 *   distinctId: 'anonymous-user',
 * });
 */
export const usePageViewAnalytics = (config: PageViewAnalyticsConfig) => {
  const {
    postHogEventFunction,
    customEventName,
    path,
    additionalProperties = {},
    requireAuth = true,
    distinctId: customDistinctId,
  } = config;

  const reportAnalytics = useReportAnalyticsEvent();
  const hasReported = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasReported.current) {
      return;
    }

    const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
    
    // Determine distinct ID
    const distinctId = customDistinctId || userInfo?.email;
    
    // Check authentication requirements
    if (requireAuth && (!userInfo?.email || !distinctId)) {
      return;
    }

    // If no auth required but no distinct ID provided, skip
    if (!requireAuth && !distinctId) {
      return;
    }

    // Mark as reported to prevent duplicate calls
    hasReported.current = true;

    // Call PostHog analytics if provided
    if (postHogEventFunction) {
      try {
        postHogEventFunction();
      } catch (error) {
        console.error('Error calling PostHog analytics:', error);
      }
    }

    // Create custom analytics event
    const pageViewEvent: TrackEventDto = {
      name: customEventName,
      distinctId: distinctId!,
      properties: {
        // Base properties
        ...(requireAuth && userInfo && {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
        }),
        path: path,
        timestamp: new Date().toISOString(),
        // Additional custom properties
        ...additionalProperties,
      },
    };

    // Report custom analytics
    reportAnalytics.mutate(pageViewEvent);
  }, [
    postHogEventFunction,
    customEventName,
    path,
    additionalProperties,
    requireAuth,
    customDistinctId,
    reportAnalytics,
  ]);

  // Return whether the analytics has been reported (useful for debugging)
  return { hasReported: hasReported.current };
};

/**
 * Convenience hook specifically for demo day pages
 * Pre-configured with demo day analytics functions
 */
export const useDemoDayPageViewAnalytics = (
  eventName: keyof ReturnType<typeof useDemoDayAnalytics>,
  customEventName: string,
  path: string,
  additionalProperties?: Record<string, any>
) => {
  const demoDayAnalytics = useDemoDayAnalytics();
  
  return usePageViewAnalytics({
    postHogEventFunction: demoDayAnalytics[eventName] as () => void,
    customEventName,
    path,
    additionalProperties,
  });
};
