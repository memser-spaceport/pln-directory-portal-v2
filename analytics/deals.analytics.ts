import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

const DEALS_ANALYTICS_EVENTS = {
  DEALS_PAGE_VIEWED: 'deals-page-viewed',
  DEALS_CARD_CLICKED: 'deals-card-clicked',
  DEALS_FILTER_APPLIED: 'deals-filter-applied',
  DEALS_FILTER_CLEARED: 'deals-filter-cleared',
  DEALS_SORT_CHANGED: 'deals-sort-changed',
  DEALS_SHOW_MORE_CLICKED: 'deals-show-more-clicked',
  DEALS_SEARCH_PERFORMED: 'deals-search-performed',
  DEALS_DETAIL_VIEWED: 'deals-detail-viewed',
  DEALS_REDEEM_CLICKED: 'deals-redeem-clicked',
  DEALS_TOGGLE_USING_CLICKED: 'deals-toggle-using-clicked',
  DEALS_BACK_CLICKED: 'deals-back-clicked',
  DEALS_SUBMIT_MODAL_OPENED: 'deals-submit-modal-opened',
  DEALS_DEAL_SUBMITTED: 'deals-deal-submitted',
  DEALS_DEAL_SUBMIT_FAILED: 'deals-deal-submit-failed',
};

export function useDealsAnalytics() {
  const posthog = usePostHog();

  const trackDealCardClicked = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_CARD_CLICKED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackFilterApplied = useCallback(
    (filterType: string, values: string[]) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_FILTER_APPLIED, { filterType, values });
    },
    [posthog],
  );

  const trackFilterCleared = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_FILTER_CLEARED);
  }, [posthog]);

  const trackSortChanged = useCallback(
    (sort: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SORT_CHANGED, { sort });
    },
    [posthog],
  );

  const trackShowMoreClicked = useCallback(
    (page: number) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SHOW_MORE_CLICKED, { page });
    },
    [posthog],
  );

  const trackSearchPerformed = useCallback(
    (query: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SEARCH_PERFORMED, { query });
    },
    [posthog],
  );

  const trackDealDetailViewed = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_DETAIL_VIEWED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackRedeemClicked = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_REDEEM_CLICKED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackToggleUsingClicked = useCallback(
    (dealId: string, dealTitle: string, isUsing: boolean) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_TOGGLE_USING_CLICKED, { dealId, dealTitle, isUsing });
    },
    [posthog],
  );

  const trackBackClicked = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_BACK_CLICKED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackSubmitModalOpened = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SUBMIT_MODAL_OPENED);
  }, [posthog]);

  const trackDealSubmitted = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_DEAL_SUBMITTED);
  }, [posthog]);

  const trackDealSubmitFailed = useCallback(
    (error: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_DEAL_SUBMIT_FAILED, { error });
    },
    [posthog],
  );

  return {
    trackDealCardClicked,
    trackFilterApplied,
    trackFilterCleared,
    trackSortChanged,
    trackShowMoreClicked,
    trackSearchPerformed,
    trackDealDetailViewed,
    trackRedeemClicked,
    trackToggleUsingClicked,
    trackBackClicked,
    trackSubmitModalOpened,
    trackDealSubmitted,
    trackDealSubmitFailed,
  };
}
