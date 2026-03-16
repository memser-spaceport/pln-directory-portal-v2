import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

const DEALS_EVENTS = {
  PAGE_VIEW: 'deals_page_viewed',
  DEAL_CARD_CLICKED: 'deals_card_clicked',
  FILTER_APPLIED: 'deals_filter_applied',
  FILTER_CLEARED: 'deals_filter_cleared',
  SORT_CHANGED: 'deals_sort_changed',
  SHOW_MORE_CLICKED: 'deals_show_more_clicked',
  SUBMIT_DEAL_CLICKED: 'deals_submit_deal_clicked',
  SEARCH_PERFORMED: 'deals_search_performed',
};

export function useDealsAnalytics() {
  const posthog = usePostHog();

  const trackDealCardClicked = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_EVENTS.DEAL_CARD_CLICKED, { dealId, dealTitle });
    },
    [posthog]
  );

  const trackFilterApplied = useCallback(
    (filterType: string, values: string[]) => {
      posthog?.capture(DEALS_EVENTS.FILTER_APPLIED, { filterType, values });
    },
    [posthog]
  );

  const trackFilterCleared = useCallback(() => {
    posthog?.capture(DEALS_EVENTS.FILTER_CLEARED);
  }, [posthog]);

  const trackSortChanged = useCallback(
    (sort: string) => {
      posthog?.capture(DEALS_EVENTS.SORT_CHANGED, { sort });
    },
    [posthog]
  );

  const trackShowMoreClicked = useCallback(
    (page: number) => {
      posthog?.capture(DEALS_EVENTS.SHOW_MORE_CLICKED, { page });
    },
    [posthog]
  );

  const trackSearchPerformed = useCallback(
    (query: string) => {
      posthog?.capture(DEALS_EVENTS.SEARCH_PERFORMED, { query });
    },
    [posthog]
  );

  return {
    trackDealCardClicked,
    trackFilterApplied,
    trackFilterCleared,
    trackSortChanged,
    trackShowMoreClicked,
    trackSearchPerformed,
  };
}
