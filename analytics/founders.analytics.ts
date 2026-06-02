import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';
import type { FounderStatus } from '@/services/founders/types';

const FOUNDER_EVENTS = {
  PAGE_VIEWED: 'founder_db_page_viewed',
  DRAWER_OPENED: 'founder_db_drawer_opened',
  FILTER_APPLIED: 'founder_db_filter_applied',
  REVIEW_SUBMITTED: 'founder_db_review_submitted',
  REVIEW_FAILED: 'founder_db_review_failed',
} as const;

export function useFoundersAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback(
    (event: string, props: Record<string, unknown> = {}) => {
      posthog?.capture(event, props);
    },
    [posthog],
  );

  return {
    onPageViewed: () => capture(FOUNDER_EVENTS.PAGE_VIEWED),
    onDrawerOpened: (founderId: string) => capture(FOUNDER_EVENTS.DRAWER_OPENED, { founderId }),
    onFilterApplied: (filterName: string, value: unknown) =>
      capture(FOUNDER_EVENTS.FILTER_APPLIED, { filterName, value }),
    onReviewSubmitted: (founderId: string, status: FounderStatus, hasFeedback: boolean, hasNote: boolean) =>
      capture(FOUNDER_EVENTS.REVIEW_SUBMITTED, { founderId, status, hasFeedback, hasNote }),
    onReviewFailed: (founderId: string) => capture(FOUNDER_EVENTS.REVIEW_FAILED, { founderId }),
  };
}

// Convenience aliases for backwards-compatibility with call sites
export type FoundersAnalytics = ReturnType<typeof useFoundersAnalytics>;
