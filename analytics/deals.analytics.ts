import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

const DEALS_EVENTS = {
  PAGE_VIEW: 'deals_page_viewed',
  DEAL_CARD_CLICKED: 'deals_card_clicked',
  FILTER_APPLIED: 'deals_filter_applied',
  FILTER_CLEARED: 'deals_filter_cleared',
  SORT_CHANGED: 'deals_sort_changed',
  SHOW_MORE_CLICKED: 'deals_show_more_clicked',
  SEARCH_PERFORMED: 'deals_search_performed',
  DEAL_DETAIL_VIEWED: 'deals_detail_viewed',
  DEAL_REDEEM_CLICKED: 'deals_redeem_clicked',
  DEAL_TOGGLE_USING_CLICKED: 'deals_toggle_using_clicked',
  DEAL_BACK_CLICKED: 'deals_back_clicked',
};

export function useDealsAnalytics() {
  const posthog = usePostHog();

  const trackDealCardClicked = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_EVENTS.DEAL_CARD_CLICKED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackFilterApplied = useCallback(
    (filterType: string, values: string[]) => {
      posthog?.capture(DEALS_EVENTS.FILTER_APPLIED, { filterType, values });
    },
    [posthog],
  );

  const trackFilterCleared = useCallback(() => {
    posthog?.capture(DEALS_EVENTS.FILTER_CLEARED);
  }, [posthog]);

  const trackSortChanged = useCallback(
    (sort: string) => {
      posthog?.capture(DEALS_EVENTS.SORT_CHANGED, { sort });
    },
    [posthog],
  );

  const trackShowMoreClicked = useCallback(
    (page: number) => {
      posthog?.capture(DEALS_EVENTS.SHOW_MORE_CLICKED, { page });
    },
    [posthog],
  );

  const trackSearchPerformed = useCallback(
    (query: string) => {
      posthog?.capture(DEALS_EVENTS.SEARCH_PERFORMED, { query });
    },
    [posthog],
  );

  const trackDealDetailViewed = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_EVENTS.DEAL_DETAIL_VIEWED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackRedeemClicked = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_EVENTS.DEAL_REDEEM_CLICKED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackToggleUsingClicked = useCallback(
    (dealId: string, dealTitle: string, isUsing: boolean) => {
      posthog?.capture(DEALS_EVENTS.DEAL_TOGGLE_USING_CLICKED, { dealId, dealTitle, isUsing });
    },
    [posthog],
  );

  const trackBackClicked = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_EVENTS.DEAL_BACK_CLICKED, { dealId, dealTitle });
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
  };
}
